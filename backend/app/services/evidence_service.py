import datetime
import io
import mimetypes
from pathlib import Path
from typing import Any
from uuid import UUID

from fastapi import HTTPException, UploadFile, status
from PIL import ExifTags, Image
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.enums import ActivityAction, NotificationType, TimelineEventType
from app.models.evidence import Evidence
from app.models.timeline import TimelineEvent
from app.models.user import User
from app.repositories.case_repository import CaseRepository
from app.repositories.evidence_repository import EvidenceRepository
from app.services.activity import log_activity
from app.services.case_service import advance_open_to_in_progress
from app.services.notifications import notify
from app.services.storage import get_storage

ALLOWED_EXTENSIONS = {
    # Images
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tif", ".tiff",
    # Video
    ".mp4", ".avi", ".mov", ".mkv", ".webm",
    # Docs
    ".pdf", ".doc", ".docx", ".txt", ".rtf", ".md",
    # Audio
    ".mp3", ".wav", ".m4a", ".ogg", ".flac",
    # Data / exports
    ".csv", ".json", ".zip", ".eml", ".msg", ".html", ".htm",
    # GPS / logs
    ".gpx", ".kml", ".log",
}


def classify_file_type(mime_type: str | None, ext: str) -> str:
    ext = ext.lower()
    if mime_type:
        mime = mime_type.lower()
        if mime.startswith("image/"):
            return "image"
        if mime.startswith("video/"):
            return "video"
        if mime.startswith("audio/"):
            return "audio"
    if ext in {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tif", ".tiff"}:
        return "image"
    if ext in {".mp4", ".avi", ".mov", ".mkv", ".webm"}:
        return "video"
    if ext in {".mp3", ".wav", ".m4a", ".ogg", ".flac"}:
        return "audio"
    if ext in {".pdf", ".doc", ".docx", ".txt", ".rtf", ".md", ".csv", ".json", ".zip"}:
        return "document"
    if ext in {".eml", ".msg", ".html", ".htm", ".whatsapp", ".tg"}:
        return "chat_export"
    if ext in {".gpx", ".kml", ".log"}:
        return "call_log"
    return "other"


def extract_exif(data: bytes) -> dict[str, Any]:
    exif_data: dict[str, Any] = {}
    try:
        img = Image.open(io.BytesIO(data))
        exif_data["width"] = img.width
        exif_data["height"] = img.height
        raw_exif = img._getexif()
        if raw_exif:
            for tag_id, value in raw_exif.items():
                tag = ExifTags.TAGS.get(tag_id, tag_id)
                if tag in ("Make", "Model", "DateTime", "DateTimeOriginal", "Software"):
                    exif_data[str(tag)] = str(value)
                elif tag == "GPSInfo":
                    gps_info = {}
                    for k in value:
                        gps_tag = ExifTags.GPSTAGS.get(k, k)
                        gps_info[str(gps_tag)] = str(value[k])
                    exif_data["GPSInfo"] = gps_info
    except Exception:
        pass
    return exif_data


class EvidenceService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = EvidenceRepository(db)
        self.cases = CaseRepository(db)
        self.storage = get_storage()

    def upload(
        self,
        case_id: UUID,
        file: UploadFile,
        actor: User,
        *,
        description: str | None = None,
        tags: list[str] | None = None,
    ) -> Evidence:
        case = self.cases.get(case_id)
        if not case:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Case not found")

        original = file.filename or "upload.bin"
        ext = Path(original).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {ext or '(none)'}",
            )

        data = file.file.read()
        settings = get_settings()
        if len(data) > settings.max_upload_bytes:
            raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File too large")
        if not data:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Empty file")

        storage_path, sha256 = self.storage.save(case_id=str(case_id), filename=original, data=data)
        dup = self.repo.find_by_hash(case_id, sha256)
        mime, _ = mimetypes.guess_type(original)
        file_type = classify_file_type(mime or file.content_type, ext)

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        metadata_json: dict[str, Any] = {
            "extension": ext,
            "file_created_at": now_iso,
            "file_modified_at": now_iso,
        }
        if file_type == "image":
            exif = extract_exif(data)
            if exif:
                metadata_json["exif"] = exif

        warning_msg = None
        if dup:
            warning_msg = f"Duplicate file detected: matches existing evidence '{dup.original_name}' (ID: {dup.id})"
            metadata_json["duplicate_warning"] = warning_msg

        evidence = Evidence(
            case_id=case_id,
            filename=Path(storage_path).name,
            original_name=original,
            file_type=file_type,
            mime_type=mime or file.content_type,
            file_size=len(data),
            storage_path=storage_path,
            sha256_hash=sha256,
            description=description,
            tags=tags or [],
            metadata_json=metadata_json,
            uploaded_by_id=actor.id,
            is_duplicate=dup is not None,
            duplicate_of_id=dup.id if dup else None,
            # AI placeholders intentionally left null
        )
        self.repo.add(evidence)
        self.db.flush()
        advance_open_to_in_progress(self.db, case, actor)

        self.db.add(
            TimelineEvent(
                case_id=case_id,
                event_type=TimelineEventType.evidence_uploaded,
                title="Evidence uploaded",
                description=original,
                created_by_id=actor.id,
                metadata_json={"evidence_id": str(evidence.id)},
            )
        )
        for a in case.assignments:
            if a.user_id != actor.id:
                notify(
                    self.db,
                    user_id=a.user_id,
                    notification_type=NotificationType.evidence_uploaded,
                    title="Evidence uploaded",
                    message=f"{original} added to {case.case_number}",
                    link=f"/dashboard/cases/{case_id}",
                )
        actor_role_str = actor.role.value if hasattr(actor.role, "value") else str(actor.role)
        log_activity(
            self.db,
            user_id=actor.id,
            case_id=case_id,
            actor_role=actor_role_str,
            action=ActivityAction.create,
            resource_type="evidence",
            resource_id=str(evidence.id),
            description=f"Uploaded evidence {original}",
        )
        self.db.commit()
        return self.repo.get(evidence.id)  # type: ignore[return-value]

    def get(self, evidence_id: UUID) -> Evidence:
        item = self.repo.get(evidence_id)
        if not item:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Evidence not found")
        return item

    def delete(self, evidence_id: UUID, actor: User) -> None:
        item = self.repo.get(evidence_id)
        if not item:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Evidence not found")
        try:
            self.storage.delete(item.storage_path)
        except Exception:
            pass
        name = item.original_name
        case_id = item.case_id
        self.repo.delete(item)
        self.db.add(
            TimelineEvent(
                case_id=case_id,
                event_type=TimelineEventType.evidence_deleted,
                title="Evidence deleted",
                description=name,
                created_by_id=actor.id,
            )
        )
        actor_role_str = actor.role.value if hasattr(actor.role, "value") else str(actor.role)
        log_activity(
            self.db,
            user_id=actor.id,
            case_id=case_id,
            actor_role=actor_role_str,
            action=ActivityAction.delete,
            resource_type="evidence",
            resource_id=str(evidence_id),
            description=f"Deleted evidence {name}",
        )
        self.db.commit()

    def resolve_path(self, evidence: Evidence) -> Path:
        return self.storage.open_path(evidence.storage_path)
