"""Evidence API — upload, list, download, delete."""

from __future__ import annotations

import json
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.enums import ActivityAction
from app.models.user import User
from app.repositories.evidence_repository import EvidenceRepository
from app.schemas.domain import EvidenceMetaUpdate, EvidenceOut, PageOut
from app.services.activity import log_activity
from app.services.evidence_service import EvidenceService
from app.utils.pagination import paginate

from app.services.case_service import CaseService

router = APIRouter(tags=["evidence"])


def _to_evidence_out(item: Evidence) -> EvidenceOut:
    out = EvidenceOut.model_validate(item)
    out.file_hash = item.sha256_hash
    if item.is_duplicate and item.metadata_json and "duplicate_warning" in item.metadata_json:
        out.warning = item.metadata_json["duplicate_warning"]
    return out


@router.get("/cases/{case_id}/evidence", response_model=PageOut[EvidenceOut])
def list_evidence(
    case_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
    q: str | None = None,
    file_type: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
) -> PageOut[EvidenceOut]:
    CaseService(db).verify_case_access(user, case_id)
    items, total = EvidenceRepository(db).list_for_case(
        case_id, q=q, file_type=file_type, offset=(page - 1) * page_size, limit=page_size
    )
    return paginate(total, page, page_size, [_to_evidence_out(i) for i in items])


@router.post("/cases/{case_id}/evidence", response_model=EvidenceOut, status_code=201)
async def upload_evidence(
    case_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
    file: UploadFile = File(...),
    description: str | None = Form(default=None),
    tags: str | None = Form(default=None),
) -> EvidenceOut:
    CaseService(db).verify_case_access(user, case_id)
    tag_list: list[str] | None = None
    if tags:
        try:
            parsed = json.loads(tags)
            tag_list = parsed if isinstance(parsed, list) else [tags]
        except json.JSONDecodeError:
            tag_list = [t.strip() for t in tags.split(",") if t.strip()]
    item = EvidenceService(db).upload(case_id, file, user, description=description, tags=tag_list)
    return _to_evidence_out(item)


@router.get("/evidence/{evidence_id}", response_model=EvidenceOut)
def get_evidence(
    evidence_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> EvidenceOut:
    item = EvidenceService(db).get(evidence_id)
    CaseService(db).verify_case_access(user, item.case_id)
    return _to_evidence_out(item)


@router.patch("/evidence/{evidence_id}", response_model=EvidenceOut)
def update_evidence_meta(
    evidence_id: UUID,
    payload: EvidenceMetaUpdate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> EvidenceOut:
    svc = EvidenceService(db)
    item = svc.get(evidence_id)
    CaseService(db).verify_case_access(user, item.case_id)
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(item, k, v)
    db.add(item)
    db.commit()
    db.refresh(item)
    return _to_evidence_out(item)


@router.get("/evidence/{evidence_id}/download")
def download_evidence(
    evidence_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> FileResponse:
    svc = EvidenceService(db)
    item = svc.get(evidence_id)
    CaseService(db).verify_case_access(user, item.case_id)
    path = svc.resolve_path(item)
    log_activity(
        db,
        user_id=user.id,
        action=ActivityAction.download,
        resource_type="evidence",
        resource_id=str(evidence_id),
        description=f"Downloaded {item.original_name}",
    )
    db.commit()
    return FileResponse(
        path,
        filename=item.original_name,
        media_type=item.mime_type or "application/octet-stream",
    )


@router.delete("/evidence/{evidence_id}")
def delete_evidence(
    evidence_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> dict:
    svc = EvidenceService(db)
    item = svc.get(evidence_id)
    CaseService(db).verify_case_access(user, item.case_id)
    svc.delete(evidence_id, user)
    return {"success": True, "message": "Evidence deleted"}
