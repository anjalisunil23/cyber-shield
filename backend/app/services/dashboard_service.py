"""Notes, timeline, relationships, leads, reports, search, dashboard services."""

from __future__ import annotations

import csv
import io
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.audit import Report
from app.models.case import Case
from app.models.enums import (
    ActivityAction,
    CasePriority,
    CaseStatus,
    NotificationType,
    ReportFormat,
    TimelineEventType,
)
from app.models.evidence import Evidence
from app.models.lead import ManualLead
from app.models.note import Note
from app.models.relationship import Relationship
from app.models.timeline import TimelineEvent
from app.models.user import User
from app.repositories.case_repository import CaseRepository
from app.repositories.common import (
    ActivityRepository,
    LeadRepository,
    NoteRepository,
    RelationshipRepository,
    ReportRepository,
    TimelineRepository,
    UserRepository,
)
from app.repositories.evidence_repository import EvidenceRepository
from app.schemas.domain import (
    DashboardStats,
    LeadCreate,
    LeadUpdate,
    NoteCreate,
    NoteUpdate,
    RelationshipCreate,
    ReportCreate,
    SearchResult,
    TimelineCreate,
)
from app.services.activity import log_activity
from app.services.case_service import advance_open_to_in_progress
from app.services.notifications import notify


class NoteService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = NoteRepository(db)

    def create(self, case_id: UUID, payload: NoteCreate, actor: User) -> Note:
        if not self.db.get(Case, case_id):
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Case not found")
        note = Note(
            case_id=case_id,
            author_id=actor.id,
            title=payload.title,
            body=payload.body,
            is_pinned=payload.is_pinned,
        )
        self.db.add(note)
        self.db.add(
            TimelineEvent(
                case_id=case_id,
                event_type=TimelineEventType.note_added,
                title="Note added",
                description=payload.title or payload.body[:80],
                created_by_id=actor.id,
            )
        )
        case = self.db.get(Case, case_id)
        advance_open_to_in_progress(self.db, case, actor)
        if case:
            for a in case.assignments:
                if a.user_id != actor.id:
                    notify(
                        self.db,
                        user_id=a.user_id,
                        notification_type=NotificationType.new_note,
                        title="New note",
                        message=f"Note added on {case.case_number}",
                        link=f"/dashboard/cases/{case_id}",
                    )
        actor_role_str = actor.role.value if hasattr(actor.role, "value") else str(actor.role)
        log_activity(
            self.db,
            user_id=actor.id,
            case_id=case_id,
            actor_role=actor_role_str,
            action=ActivityAction.create,
            resource_type="note",
            resource_id=str(note.id),
            description=f"Created note: {payload.title or payload.body[:50]}",
        )
        self.db.commit()
        self.db.refresh(note)
        return self.repo.get(note.id)  # type: ignore[return-value]

    def update(self, note_id: UUID, payload: NoteUpdate, actor: User | None = None) -> Note:
        note = self.repo.get(note_id)
        if not note:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Note not found")
        for k, v in payload.model_dump(exclude_unset=True).items():
            setattr(note, k, v)
        note.updated_at = datetime.now(timezone.utc)
        if actor:
            actor_role_str = actor.role.value if hasattr(actor.role, "value") else str(actor.role)
            log_activity(
                self.db,
                user_id=actor.id,
                case_id=note.case_id,
                actor_role=actor_role_str,
                action=ActivityAction.update,
                resource_type="note",
                resource_id=str(note_id),
                description=f"Updated note {note.title or note.body[:40]}",
            )
        self.db.commit()
        return self.repo.get(note_id)  # type: ignore[return-value]

    def delete(self, note_id: UUID, actor: User) -> None:
        note = self.repo.get(note_id)
        if not note:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Note not found")
        case_id = note.case_id
        self.db.delete(note)
        actor_role_str = actor.role.value if hasattr(actor.role, "value") else str(actor.role)
        log_activity(
            self.db,
            user_id=actor.id,
            case_id=case_id,
            actor_role=actor_role_str,
            action=ActivityAction.delete,
            resource_type="note",
            resource_id=str(note_id),
            description="Deleted note",
        )
        self.db.commit()


class TimelineService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = TimelineRepository(db)

    def create(self, case_id: UUID, payload: TimelineCreate, actor: User) -> TimelineEvent:
        if not self.db.get(Case, case_id):
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Case not found")
        event = TimelineEvent(
            case_id=case_id,
            event_type=payload.event_type,
            title=payload.title,
            description=payload.description,
            event_at=payload.event_at or datetime.now(timezone.utc),
            related_evidence_id=payload.related_evidence_id,
            created_by_id=actor.id,
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def delete(self, event_id: UUID) -> None:
        event = self.repo.get(event_id)
        if not event:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Event not found")
        self.db.delete(event)
        self.db.commit()


class RelationshipService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = RelationshipRepository(db)

    def create(self, case_id: UUID, payload: RelationshipCreate, actor: User) -> Relationship:
        if not self.db.get(Case, case_id):
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Case not found")
        rel = Relationship(
            case_id=case_id,
            relationship_type=payload.relationship_type,
            source_kind=payload.source_kind,
            source_id=payload.source_id,
            source_label=payload.source_label,
            target_kind=payload.target_kind,
            target_id=payload.target_id,
            target_label=payload.target_label,
            description=payload.description,
            created_by_id=actor.id,
            ai_generated=False,
        )
        self.db.add(rel)
        self.db.add(
            TimelineEvent(
                case_id=case_id,
                event_type=TimelineEventType.relationship_created,
                title="Relationship created",
                description=f"{payload.source_label} ({payload.source_kind.value}) → {payload.target_label} ({payload.target_kind.value})",
                created_by_id=actor.id,
            )
        )
        actor_role_str = actor.role.value if hasattr(actor.role, "value") else str(actor.role)
        log_activity(
            self.db,
            user_id=actor.id,
            case_id=case_id,
            actor_role=actor_role_str,
            action=ActivityAction.create,
            resource_type="relationship",
            resource_id=str(rel.id),
            description=f"Created relationship: {payload.source_label} → {payload.target_label}",
        )
        self.db.commit()
        self.db.refresh(rel)
        return rel

    def delete(self, rel_id: UUID, actor: User | None = None) -> None:
        rel = self.repo.get(rel_id)
        if not rel:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Relationship not found")
        case_id = rel.case_id
        self.db.delete(rel)
        if actor:
            actor_role_str = actor.role.value if hasattr(actor.role, "value") else str(actor.role)
            log_activity(
                self.db,
                user_id=actor.id,
                case_id=case_id,
                actor_role=actor_role_str,
                action=ActivityAction.delete,
                resource_type="relationship",
                resource_id=str(rel_id),
                description=f"Deleted relationship: {rel.source_label} → {rel.target_label}",
            )
        self.db.commit()


class LeadService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = LeadRepository(db)

    def create(self, case_id: UUID, payload: LeadCreate, actor: User) -> ManualLead:
        if not self.db.get(Case, case_id):
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Case not found")
        
        rel_ev_id = payload.related_evidence_id
        rel_ev_ids = [str(i) for i in payload.related_evidence_ids] if payload.related_evidence_ids else []
        if rel_ev_id and str(rel_ev_id) not in rel_ev_ids:
            rel_ev_ids.append(str(rel_ev_id))

        lead = ManualLead(
            case_id=case_id,
            title=payload.title,
            description=payload.description,
            priority=payload.priority,
            status=payload.status,
            related_evidence_id=rel_ev_id,
            related_evidence_ids=rel_ev_ids,
            justification=payload.justification,
            assigned_to_id=payload.assigned_to_id,
            created_by_id=actor.id,
        )
        self.db.add(lead)
        self.db.add(
            TimelineEvent(
                case_id=case_id,
                event_type=TimelineEventType.lead_created,
                title="Lead created",
                description=payload.title,
                created_by_id=actor.id,
            )
        )
        if payload.assigned_to_id:
            notify(
                self.db,
                user_id=payload.assigned_to_id,
                notification_type=NotificationType.lead_created,
                title="Lead assigned",
                message=payload.title,
                link=f"/dashboard/cases/{case_id}",
            )
        actor_role_str = actor.role.value if hasattr(actor.role, "value") else str(actor.role)
        log_activity(
            self.db,
            user_id=actor.id,
            case_id=case_id,
            actor_role=actor_role_str,
            action=ActivityAction.create,
            resource_type="lead",
            resource_id=str(lead.id),
            description=f"Created lead: {payload.title}",
        )
        self.db.commit()
        self.db.refresh(lead)
        return self.repo.get(lead.id)  # type: ignore[return-value]

    def update(self, lead_id: UUID, payload: LeadUpdate, actor: User | None = None) -> ManualLead:
        lead = self.repo.get(lead_id)
        if not lead:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Lead not found")
        
        old_status = lead.status
        data = payload.model_dump(exclude_unset=True)
        if "related_evidence_ids" in data and data["related_evidence_ids"] is not None:
            data["related_evidence_ids"] = [str(i) for i in data["related_evidence_ids"]]
            
        for k, v in data.items():
            setattr(lead, k, v)
        lead.updated_at = datetime.now(timezone.utc)

        if actor:
            actor_role_str = actor.role.value if hasattr(actor.role, "value") else str(actor.role)
            log_activity(
                self.db,
                user_id=actor.id,
                case_id=lead.case_id,
                actor_role=actor_role_str,
                action=ActivityAction.update,
                resource_type="lead",
                resource_id=str(lead_id),
                description=f"Updated lead: {lead.title} (status: {lead.status.value})",
            )
            if "status" in data and data["status"] != old_status:
                self.db.add(
                    TimelineEvent(
                        case_id=lead.case_id,
                        event_type=TimelineEventType.manual,
                        title="Lead Status Updated",
                        description=f"Lead '{lead.title}' status updated to {lead.status.value}",
                        created_by_id=actor.id,
                    )
                )

        self.db.commit()
        return self.repo.get(lead_id)  # type: ignore[return-value]

    def delete(self, lead_id: UUID, actor: User | None = None) -> None:
        lead = self.repo.get(lead_id)
        if not lead:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Lead not found")
        case_id = lead.case_id
        title = lead.title
        self.db.delete(lead)
        if actor:
            actor_role_str = actor.role.value if hasattr(actor.role, "value") else str(actor.role)
            log_activity(
                self.db,
                user_id=actor.id,
                case_id=case_id,
                actor_role=actor_role_str,
                action=ActivityAction.delete,
                resource_type="lead",
                resource_id=str(lead_id),
                description=f"Deleted lead: {title}",
            )
        self.db.commit()


class ReportService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = ReportRepository(db)
        self.cases = CaseRepository(db)
        self.evidence = EvidenceRepository(db)
        self.notes = NoteRepository(db)
        self.timeline = TimelineRepository(db)
        self.leads = LeadRepository(db)
        self.relationships = RelationshipRepository(db)

    def generate(self, case_id: UUID, payload: ReportCreate, actor: User) -> Report:
        case = self.cases.get(case_id)
        if not case:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Case not found")

        evidence_items, evid_count = self.evidence.list_for_case(case_id, limit=500)
        timeline_events = self.timeline.list_for_case(case_id)
        leads_list = self.leads.list_for_case(case_id)
        rel_list = self.relationships.list_for_case(case_id)
        assignees = [a.user.full_name for a in case.assignments if a.user]
        
        case_summary_text = payload.case_summary or case.description or case.notes or "No initial summary provided."

        summary = {
            "case_number": case.case_number,
            "title": case.title,
            "status": case.status.value,
            "priority": case.priority.value,
            "evidence_count": evid_count,
            "timeline_count": len(timeline_events),
            "leads_count": len(leads_list),
            "relationships_count": len(rel_list),
            "assignees": assignees,
        }

        title = payload.title or f"Investigation Draft Report — {case.case_number}"
        content: str | None = None

        if payload.format == ReportFormat.csv:
            buf = io.StringIO()
            writer = csv.writer(buf)
            writer.writerow(["=== CASE SUMMARY ==="])
            writer.writerow(["Case Number", case.case_number])
            writer.writerow(["Title", case.title])
            writer.writerow(["Status", case.status.value])
            writer.writerow(["Priority", case.priority.value])
            writer.writerow(["Summary Text", case_summary_text])
            writer.writerow([])
            
            writer.writerow(["=== EVIDENCE LIST ==="])
            writer.writerow(["Original Name", "File Type", "Size (bytes)", "SHA-256 Hash", "Duplicate?"])
            for e in evidence_items:
                writer.writerow([e.original_name, e.file_type, e.file_size, e.sha256_hash, "Yes" if e.is_duplicate else "No"])
            writer.writerow([])

            writer.writerow(["=== TIMELINE ==="])
            writer.writerow(["Event Time", "Title", "Type", "Description"])
            for t in timeline_events:
                writer.writerow([t.event_at.isoformat() if t.event_at else "", t.title, t.event_type.value, t.description or ""])
            writer.writerow([])

            writer.writerow(["=== LEADS ==="])
            writer.writerow(["Title", "Priority", "Status", "Justification", "Review Comment"])
            for l in leads_list:
                writer.writerow([l.title, l.priority.value, l.status.value, l.justification or "", l.review_comment or ""])
            writer.writerow([])

            writer.writerow(["=== RELATIONSHIPS ==="])
            writer.writerow(["Entity A", "Kind A", "Relationship", "Entity B", "Kind B", "Note"])
            for r in rel_list:
                writer.writerow([r.source_label, r.source_kind.value, r.relationship_type.value, r.target_label, r.target_kind.value, r.description or ""])

            content = buf.getvalue()
        else:
            # HTML Draft Report
            lines = [
                "<!DOCTYPE html>",
                "<html><head><meta charset='utf-8'><title>" + title + "</title>",
                "<style>",
                "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 30px; color: #1e293b; background: #fff; }",
                "h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }",
                "h2 { color: #1e293b; margin-top: 30px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; }",
                ".badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; background: #f1f5f9; }",
                "table { width: 100%; border-collapse: collapse; margin-top: 10px; }",
                "th, td { text-align: left; padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 13px; }",
                "th { background: #f8fafc; font-weight: 600; }",
                ".box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; font-size: 14px; }",
                "</style></head><body>",
                f"<h1>{title}</h1>",
                f"<div class='box'><p><strong>Case Number:</strong> {case.case_number} | <strong>Status:</strong> <span class='badge'>{case.status.value.upper()}</span> | <strong>Priority:</strong> <span class='badge'>{case.priority.value.upper()}</span></p>",
                f"<p><strong>Assigned Investigators:</strong> {', '.join(assignees) if assignees else 'Unassigned'}</p>",
                f"<h3>Case Summary</h3><p>{case_summary_text}</p></div>",
                
                f"<h2>Linked Evidence ({evid_count})</h2>",
                "<table><thead><tr><th>Filename</th><th>Type</th><th>Size</th><th>SHA-256 Hash</th><th>Status</th></tr></thead><tbody>",
            ]
            for e in evidence_items:
                dup_str = "<span style='color: #d97706; font-weight: bold;'>DUPLICATE</span>" if e.is_duplicate else "Unique"
                lines.append(f"<tr><td>{e.original_name}</td><td>{e.file_type}</td><td>{(e.file_size/1024):.1f} KB</td><td><code>{e.sha256_hash[:16]}...</code></td><td>{dup_str}</td></tr>")
            lines.append("tbody</table>")

            lines.append(f"<h2>Investigation Timeline ({len(timeline_events)})</h2>")
            lines.append("<table><thead><tr><th>Event Time</th><th>Title</th><th>Type</th><th>Description</th></tr></thead><tbody>")
            for t in timeline_events:
                t_str = t.event_at.strftime("%Y-%m-%d %H:%M") if t.event_at else ""
                lines.append(f"<tr><td>{t_str}</td><td><strong>{t.title}</strong></td><td>{t.event_type.value}</td><td>{t.description or '-'}</td></tr>")
            lines.append("tbody</table>")

            lines.append(f"<h2>Investigation Leads ({len(leads_list)})</h2>")
            lines.append("<table><thead><tr><th>Title</th><th>Priority</th><th>Status</th><th>Justification</th><th>Review Comment</th></tr></thead><tbody>")
            for l in leads_list:
                lines.append(f"<tr><td><strong>{l.title}</strong></td><td>{l.priority.value}</td><td>{l.status.value}</td><td>{l.justification or '-'}</td><td>{l.review_comment or '-'}</td></tr>")
            lines.append("tbody</table>")

            lines.append(f"<h2>Entity Relationships ({len(rel_list)})</h2>")
            lines.append("<table><thead><tr><th>Entity A</th><th>Type</th><th>Entity B</th><th>Connection Note</th></tr></thead><tbody>")
            for r in rel_list:
                lines.append(f"<tr><td>{r.source_label} ({r.source_kind.value})</td><td>{r.relationship_type.value}</td><td>{r.target_label} ({r.target_kind.value})</td><td>{r.description or '-'}</td></tr>")
            lines.append("tbody</table></body></html>")

            content = "\n".join(lines)

        report = Report(
            case_id=case_id,
            title=title,
            format=payload.format,
            content=content,
            generated_by_id=actor.id,
            summary_json=summary,
        )
        self.db.add(report)
        self.db.add(
            TimelineEvent(
                case_id=case_id,
                event_type=TimelineEventType.report_generated,
                title="Report generated",
                description=title,
                created_by_id=actor.id,
            )
        )
        actor_role_str = actor.role.value if hasattr(actor.role, "value") else str(actor.role)
        log_activity(
            self.db,
            user_id=actor.id,
            case_id=case_id,
            actor_role=actor_role_str,
            action=ActivityAction.export,
            resource_type="report",
            resource_id=str(report.id),
            description=f"Generated report for {case.case_number}",
        )
        self.db.commit()
        self.db.refresh(report)
        return report


class SearchService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def search(self, q: str) -> SearchResult:
        from app.schemas.domain import CaseOut, EvidenceOut, NoteOut, ReportOut, UserBrief

        if not q.strip():
            return SearchResult()
        cases, _ = CaseRepository(self.db).list(q=q, limit=10)
        evidence = EvidenceRepository(self.db).global_search(q, limit=10)
        notes = NoteRepository(self.db).search(q, limit=10)
        users = UserRepository(self.db).search(q, limit=10)
        reports = ReportRepository(self.db).search(q, limit=10)
        return SearchResult(
            cases=[CaseOut.model_validate(c) for c in cases],
            evidence=[EvidenceOut.model_validate(e) for e in evidence],
            notes=[NoteOut.model_validate(n) for n in notes],
            investigators=[UserBrief.model_validate(u) for u in users],
            reports=[ReportOut.model_validate(r) for r in reports],
        )


class DashboardService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def stats(self) -> DashboardStats:
        from app.schemas.domain import ActivityOut, CaseOut, EvidenceOut

        active = (
            self.db.scalar(
                select(func.count()).select_from(Case).where(
                    Case.status.notin_([CaseStatus.completed, CaseStatus.archived])
                )
            )
            or 0
        )
        completed = (
            self.db.scalar(select(func.count()).select_from(Case).where(Case.status == CaseStatus.completed))
            or 0
        )
        evidence_count = self.db.scalar(select(func.count()).select_from(Evidence)) or 0
        investigators = self.db.scalar(select(func.count()).select_from(User).where(User.is_active.is_(True))) or 0
        reports = self.db.scalar(select(func.count()).select_from(Report)) or 0

        # Monthly cases (last 6 months)
        monthly_raw = self.db.execute(
            select(
                func.to_char(Case.created_at, "YYYY-MM").label("month"),
                func.count().label("count"),
            )
            .group_by("month")
            .order_by("month")
            .limit(12)
        ).all()
        monthly_cases = [{"month": r.month, "count": r.count} for r in monthly_raw]

        type_raw = self.db.execute(
            select(Evidence.file_type, func.count()).group_by(Evidence.file_type)
        ).all()
        evidence_types = [{"type": r[0], "count": r[1]} for r in type_raw]

        pri_raw = self.db.execute(
            select(Case.priority, func.count()).group_by(Case.priority)
        ).all()
        priority_distribution = [{"priority": r[0].value if r[0] else "unknown", "count": r[1]} for r in pri_raw]

        activities, _ = ActivityRepository(self.db).list(limit=10)
        recent_cases, _ = CaseRepository(self.db).list(sort_by="created_at", sort_dir="desc", limit=5)
        latest = list(
            self.db.scalars(
                select(Evidence).order_by(Evidence.upload_date.desc()).limit(5)
            ).all()
        )

        return DashboardStats(
            active_cases=active,
            completed_cases=completed,
            evidence_uploaded=evidence_count,
            investigators=investigators,
            reports=reports,
            monthly_cases=monthly_cases,
            evidence_types=evidence_types,
            priority_distribution=priority_distribution,
            recent_activity=[ActivityOut.model_validate(a) for a in activities],
            recent_cases=[CaseOut.model_validate(c) for c in recent_cases],
            latest_uploads=[EvidenceOut.model_validate(e) for e in latest],
        )
