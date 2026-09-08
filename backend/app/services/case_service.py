"""Case domain service."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.case import Case, CaseAssignment, InvestigatorAssignment
from app.models.enums import ActivityAction, CasePriority, CaseStatus, NotificationType, TimelineEventType
from app.models.timeline import TimelineEvent
from app.models.user import User, UserRole
from app.repositories.case_repository import CaseRepository
from app.schemas.domain import (
    CaseAssign,
    CaseCreate,
    CaseInvestigatorOut,
    CaseTeamResponse,
    CaseUpdate,
    UserBrief,
)
from app.services.activity import log_activity
from app.services.chat_service import ChatService
from app.services.notifications import notify

REVIEWER_ROLES = ("supervisor", "superior_officer", "major_admin", "admin")
SUBMITTABLE_STATUSES = {
    CaseStatus.open,
    CaseStatus.in_progress,
    CaseStatus.changes_requested,
    CaseStatus.evidence_collection,
    CaseStatus.analysis,
}


def _actor_role(actor: User) -> str:
    return actor.role.value if hasattr(actor.role, "value") else str(actor.role)


def advance_open_to_in_progress(db: Session, case: Case | None, actor: User) -> None:
    """Advance OPEN cases when investigation work (evidence/notes) begins."""
    if case is None or case.status != CaseStatus.open:
        return
    case.status = CaseStatus.in_progress
    case.updated_at = datetime.now(timezone.utc)
    db.add(
        TimelineEvent(
            case_id=case.id,
            event_type=TimelineEventType.status_updated,
            title="Status updated",
            description="open → in_progress",
            created_by_id=actor.id,
            event_at=datetime.now(timezone.utc),
        )
    )


class CaseService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = CaseRepository(db)

    def create(self, payload: CaseCreate, actor: User) -> Case:
        role = _actor_role(actor)
        supervisor_id = actor.id if role in ("supervisor", "superior_officer") else None

        # Determine Investigator Lead (from explicit investigator_lead_id or first assignee)
        lead_id: UUID | None = payload.investigator_lead_id
        if not lead_id and payload.assignee_ids:
            lead_id = payload.assignee_ids[0]
        elif not lead_id and role == "investigator":
            lead_id = actor.id

        case = Case(
            case_number=self.repo.next_case_number(),
            title=payload.title.strip(),
            description=payload.description,
            priority=payload.priority,
            status=payload.status,
            notes=payload.notes,
            created_by_id=actor.id,
            supervisor_id=supervisor_id,
            investigator_lead_id=lead_id,
            department_id=getattr(actor, "department_id", None),
        )
        self.repo.add(case)
        self.db.flush()

        now_dt = datetime.now(timezone.utc)
        assignee_ids = list(dict.fromkeys(payload.assignee_ids or []))
        if lead_id and lead_id not in assignee_ids:
            assignee_ids.append(lead_id)
        if actor.id not in assignee_ids:
            assignee_ids.insert(0, actor.id)

        for i, uid in enumerate(assignee_ids):
            self.db.add(
                CaseAssignment(
                    case_id=case.id,
                    user_id=uid,
                    assigned_by_id=actor.id,
                    is_primary=(uid == lead_id) or (lead_id is None and i == 0),
                )
            )

        # Establish investigator lead assignment
        if lead_id:
            self.db.add(
                InvestigatorAssignment(
                    case_id=case.id,
                    user_id=lead_id,
                    role="INVESTIGATOR_LEAD",
                    status="active",
                    assigned_by_id=actor.id,
                    assigned_at=now_dt,
                )
            )
            lead_user = self.db.get(User, lead_id)
            if lead_user:
                if lead_id != actor.id:
                    notify(
                        self.db,
                        user_id=lead_id,
                        notification_type=NotificationType.case_assigned,
                        title="Assigned as Investigator Lead",
                        message=f"You were established as Investigator Lead for case {case.case_number}: {case.title}",
                        link=f"/dashboard/cases/{case.id}",
                    )
                self.db.add(
                    TimelineEvent(
                        case_id=case.id,
                        event_type=TimelineEventType.investigator_assigned,
                        title="Investigator Lead Assigned",
                        description=f"{lead_user.full_name} established as Investigator Lead.",
                        created_by_id=actor.id,
                        event_at=now_dt,
                    )
                )

        # Notify other assignees
        for uid in assignee_ids:
            if uid != actor.id and uid != lead_id:
                notify(
                    self.db,
                    user_id=uid,
                    notification_type=NotificationType.case_assigned,
                    title="Case assigned",
                    message=f"You were assigned to case {case.case_number}: {case.title}",
                    link=f"/dashboard/cases/{case.id}",
                )

        self.db.add(
            TimelineEvent(
                case_id=case.id,
                event_type=TimelineEventType.case_created,
                title="Case created",
                description=f"{case.case_number} — {case.title}",
                created_by_id=actor.id,
                event_at=now_dt,
            )
        )
        log_activity(
            self.db,
            user_id=actor.id,
            case_id=case.id,
            actor_role=role,
            action=ActivityAction.create,
            resource_type="case",
            resource_id=str(case.id),
            description=f"Created case {case.case_number}",
        )

        # Automatically initialize official Case Investigation Group Chat
        chat_svc = ChatService(self.db)
        chat_svc.get_or_create_case_group(case, actor=actor)

        self.db.commit()
        return self.repo.get(case.id)  # type: ignore[return-value]

    def verify_case_access(self, actor: User, case_id: UUID) -> Case:
        case = self.repo.get(case_id)
        if not case:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Case not found")

        role = _actor_role(actor)
        if role in ("major_admin", "admin"):
            return case

        if role in ("supervisor", "superior_officer"):
            if case.supervisor_id == actor.id or case.supervisor_id is None:
                return case
            if actor.department_id and case.department_id == actor.department_id:
                return case
            if not actor.department_id or not case.department_id:
                return case
            if case.created_by_id == actor.id:
                return case
            if case.investigator_lead_id == actor.id:
                return case
            if any(a.user_id == actor.id for a in case.assignments):
                return case
            if any(ia.user_id == actor.id and ia.status == "active" for ia in case.investigator_assignments):
                return case
            raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Access to this case is forbidden")

        # investigator
        if (
            case.created_by_id == actor.id
            or case.investigator_lead_id == actor.id
            or any(a.user_id == actor.id for a in case.assignments)
            or any(ia.user_id == actor.id and ia.status == "active" for ia in case.investigator_assignments)
        ):
            return case

        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Access to this case is forbidden")

    def _supervisor_recipient_ids(self, case: Case, actor: User) -> set[UUID]:
        recipients: set[UUID] = set()
        if case.supervisor_id and case.supervisor_id != actor.id:
            recipients.add(case.supervisor_id)
        if case.created_by_id != actor.id:
            recipients.add(case.created_by_id)
        if recipients:
            return recipients

        stmt = select(User.id).where(User.is_active.is_(True), User.role == UserRole.supervisor)
        if case.department_id:
            stmt = stmt.where(or_(User.department_id == case.department_id, User.department_id.is_(None)))
        for uid in self.db.scalars(stmt).all():
            if uid != actor.id:
                recipients.add(uid)
        return recipients

    def submit_for_review(self, case_id: UUID, actor: User) -> Case:
        case = self.verify_case_access(actor, case_id)
        role = _actor_role(actor)

        if case.status == CaseStatus.under_review:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Case is already under review")
        if case.status not in SUBMITTABLE_STATUSES:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot submit a case with status '{case.status.value}' for review",
            )

        case.status = CaseStatus.under_review
        case.submitted_at = datetime.now(timezone.utc)
        case.updated_at = datetime.now(timezone.utc)

        self.db.add(
            TimelineEvent(
                case_id=case.id,
                event_type=TimelineEventType.review_submitted,
                title="Case Submitted for Review",
                description=f"Case {case.case_number} submitted for review by {actor.full_name}",
                created_by_id=actor.id,
                event_at=datetime.now(timezone.utc),
            )
        )
        log_activity(
            self.db,
            user_id=actor.id,
            case_id=case.id,
            actor_role=role,
            action=ActivityAction.submit_for_review,
            resource_type="case",
            resource_id=str(case.id),
            description=f"Submitted case {case.case_number} for supervisor review",
        )

        for uid in self._supervisor_recipient_ids(case, actor):
            notify(
                self.db,
                user_id=uid,
                notification_type=NotificationType.review_requested,
                title="Case Review Requested",
                message=f"{actor.full_name} submitted case {case.case_number}: {case.title} for review",
                link=f"/dashboard/cases/{case.id}",
            )

        self.db.commit()
        return self.repo.get(case_id)  # type: ignore[return-value]

    def review_case(self, case_id: UUID, action: str, review_comment: str | None, actor: User) -> Case:
        case = self.verify_case_access(actor, case_id)
        role = _actor_role(actor)

        if role not in REVIEWER_ROLES:
            raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Only supervisors and administrators can review cases")
        if case.status != CaseStatus.under_review:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail="Case must be under review before it can be approved or sent back",
            )

        clean_action = (action or "").strip().lower()
        now_dt = datetime.now(timezone.utc)

        if clean_action == "approve":
            case.status = CaseStatus.approved
            case.reviewed_at = now_dt
            case.updated_at = now_dt
            if not case.supervisor_id:
                case.supervisor_id = actor.id
            if review_comment and review_comment.strip():
                case.review_comment = review_comment.strip()

            self.db.add(
                TimelineEvent(
                    case_id=case.id,
                    event_type=TimelineEventType.case_approved,
                    title="Case Approved",
                    description=review_comment.strip() if review_comment and review_comment.strip() else f"Case {case.case_number} approved by {actor.full_name}",
                    created_by_id=actor.id,
                    event_at=now_dt,
                )
            )
            log_activity(
                self.db,
                user_id=actor.id,
                case_id=case.id,
                actor_role=role,
                action=ActivityAction.approve,
                resource_type="case",
                resource_id=str(case.id),
                description=f"Approved case {case.case_number}",
            )

            notify_ids = {a.user_id for a in case.assignments} | {case.created_by_id}
            notify_ids.discard(actor.id)
            for uid in notify_ids:
                notify(
                    self.db,
                    user_id=uid,
                    notification_type=NotificationType.case_approved,
                    title="Case Approved",
                    message=f"Case {case.case_number} ({case.title}) has been approved by {actor.full_name}",
                    link=f"/dashboard/cases/{case.id}",
                )

        elif clean_action == "request_changes":
            if not review_comment or not review_comment.strip():
                raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Review comment is required when requesting changes")

            comment_str = review_comment.strip()
            case.status = CaseStatus.changes_requested
            case.review_comment = comment_str
            case.reviewed_at = now_dt
            case.updated_at = now_dt
            if not case.supervisor_id:
                case.supervisor_id = actor.id

            self.db.add(
                TimelineEvent(
                    case_id=case.id,
                    event_type=TimelineEventType.changes_requested,
                    title="Changes Requested",
                    description=f"Supervisor feedback: {comment_str}",
                    created_by_id=actor.id,
                    event_at=now_dt,
                )
            )
            log_activity(
                self.db,
                user_id=actor.id,
                case_id=case.id,
                actor_role=role,
                action=ActivityAction.request_changes,
                resource_type="case",
                resource_id=str(case.id),
                description=f"Requested changes on case {case.case_number}: {comment_str}",
            )

            notify_ids = {a.user_id for a in case.assignments} | {case.created_by_id}
            notify_ids.discard(actor.id)
            for uid in notify_ids:
                notify(
                    self.db,
                    user_id=uid,
                    notification_type=NotificationType.changes_requested,
                    title="Changes Requested on Case",
                    message=f"Supervisor {actor.full_name} requested changes on {case.case_number}: {comment_str}",
                    link=f"/dashboard/cases/{case.id}",
                )
        else:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Action must be 'approve' or 'request_changes'")

        self.db.commit()
        return self.repo.get(case_id)  # type: ignore[return-value]

    def close_case(self, case_id: UUID, actor: User) -> Case:
        case = self.verify_case_access(actor, case_id)
        role = _actor_role(actor)
        if role not in REVIEWER_ROLES:
            raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Only supervisors and administrators can close cases")
        if case.status != CaseStatus.approved:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Only approved cases can be closed")

        now_dt = datetime.now(timezone.utc)
        case.status = CaseStatus.closed
        case.updated_at = now_dt
        self.db.add(
            TimelineEvent(
                case_id=case.id,
                event_type=TimelineEventType.status_updated,
                title="Case Closed",
                description=f"Case {case.case_number} closed by {actor.full_name}",
                created_by_id=actor.id,
                event_at=now_dt,
            )
        )
        log_activity(
            self.db,
            user_id=actor.id,
            case_id=case.id,
            actor_role=role,
            action=ActivityAction.update,
            resource_type="case",
            resource_id=str(case.id),
            description=f"Closed case {case.case_number}",
        )
        notify_ids = {a.user_id for a in case.assignments} | {case.created_by_id}
        notify_ids.discard(actor.id)
        for uid in notify_ids:
            notify(
                self.db,
                user_id=uid,
                notification_type=NotificationType.case_closed,
                title="Case Closed",
                message=f"Case {case.case_number} ({case.title}) has been closed by {actor.full_name}",
                link=f"/dashboard/cases/{case.id}",
            )
        self.db.commit()
        return self.repo.get(case_id)  # type: ignore[return-value]

    def update(self, case_id: UUID, payload: CaseUpdate, actor: User) -> Case:
        case = self.verify_case_access(actor, case_id)
        role = _actor_role(actor)

        data = payload.model_dump(exclude_unset=True)
        status_changed = "status" in data and data["status"] != case.status
        old_status = case.status
        workflow_statuses = {
            CaseStatus.under_review,
            CaseStatus.changes_requested,
            CaseStatus.approved,
            CaseStatus.closed,
        }
        if status_changed and (old_status in workflow_statuses or data["status"] in workflow_statuses):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail="Use submit-review, review, or close endpoints to change workflow status",
            )

        for k, v in data.items():
            setattr(case, k, v)
        case.updated_at = datetime.now(timezone.utc)

        if status_changed:
            self.db.add(
                TimelineEvent(
                    case_id=case.id,
                    event_type=TimelineEventType.status_updated,
                    title="Status updated",
                    description=f"{old_status.value} → {case.status.value}",
                    created_by_id=actor.id,
                )
            )
            for a in case.assignments:
                if a.user_id != actor.id:
                    notify(
                        self.db,
                        user_id=a.user_id,
                        notification_type=NotificationType.status_changed,
                        title="Case status changed",
                        message=f"{case.case_number} is now {case.status.value}",
                        link=f"/dashboard/cases/{case.id}",
                    )

        log_activity(
            self.db,
            user_id=actor.id,
            case_id=case.id,
            actor_role=role,
            action=ActivityAction.update,
            resource_type="case",
            resource_id=str(case.id),
            description=f"Updated case {case.case_number}",
        )
        self.db.commit()
        return self.repo.get(case_id)  # type: ignore[return-value]

    def delete(self, case_id: UUID, actor: User) -> None:
        case = self.verify_case_access(actor, case_id)
        role = _actor_role(actor)
        number = case.case_number
        self.repo.delete(case)
        log_activity(
            self.db,
            user_id=actor.id,
            case_id=case_id,
            actor_role=role,
            action=ActivityAction.delete,
            resource_type="case",
            resource_id=str(case_id),
            description=f"Deleted case {number}",
        )
        self.db.commit()

    def assign(self, case_id: UUID, payload: CaseAssign, actor: User) -> Case:
        case = self.verify_case_access(actor, case_id)
        role = _actor_role(actor)
        user = self.db.get(User, payload.user_id)
        if not user or not user.is_active:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="User not found")

        existing = next((a for a in case.assignments if a.user_id == payload.user_id), None)
        if existing:
            existing.is_primary = payload.is_primary or existing.is_primary
        else:
            self.db.add(
                CaseAssignment(
                    case_id=case.id,
                    user_id=payload.user_id,
                    assigned_by_id=actor.id,
                    is_primary=payload.is_primary,
                )
            )
            notify(
                self.db,
                user_id=payload.user_id,
                notification_type=NotificationType.case_assigned,
                title="Case assigned",
                message=f"You were assigned to case {case.case_number}",
                link=f"/dashboard/cases/{case.id}",
            )

        self.db.add(
            TimelineEvent(
                case_id=case.id,
                event_type=TimelineEventType.investigator_assigned,
                title="Investigator assigned",
                description=user.full_name,
                created_by_id=actor.id,
            )
        )
        log_activity(
            self.db,
            user_id=actor.id,
            case_id=case.id,
            actor_role=role,
            action=ActivityAction.assign,
            resource_type="case",
            resource_id=str(case.id),
            description=f"Assigned {user.full_name} to case {case.case_number}",
        )
        case.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        return self.repo.get(case_id)  # type: ignore[return-value]

    def list(
        self,
        *,
        actor: User,
        q: str | None,
        status: CaseStatus | None,
        priority: CasePriority | None,
        assigned_to: UUID | None,
        sort_by: str,
        sort_dir: str,
        page: int,
        page_size: int,
    ) -> tuple[list[Case], int]:
        offset = (page - 1) * page_size
        role = actor.role.value if hasattr(actor.role, "value") else str(actor.role)
        return self.repo.list(
            q=q,
            status=status,
            priority=priority,
            assigned_to=assigned_to,
            user_id=actor.id,
            user_role=role,
            user_department_id=actor.department_id,
            sort_by=sort_by,
            sort_dir=sort_dir,
            offset=offset,
            limit=page_size,
        )

    def get(self, case_id: UUID, actor: User | None = None) -> Case:
        if actor:
            return self.verify_case_access(actor, case_id)
        case = self.repo.get(case_id)
        if not case:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Case not found")
        return case

    def get_team(self, case_id: UUID, actor: User) -> CaseTeamResponse:
        case = self.verify_case_access(actor, case_id)

        lead_assignment = next(
            (ia for ia in case.investigator_assignments if ia.role == "INVESTIGATOR_LEAD" and ia.status == "active"),
            None,
        )
        lead_out: CaseInvestigatorOut | None = None
        if lead_assignment:
            lead_out = CaseInvestigatorOut(
                id=lead_assignment.id,
                case_id=lead_assignment.case_id,
                user_id=lead_assignment.user_id,
                role=lead_assignment.role,
                status=lead_assignment.status,
                assigned_by_id=lead_assignment.assigned_by_id,
                assigned_at=lead_assignment.assigned_at,
                user=UserBrief.model_validate(lead_assignment.user) if lead_assignment.user else None,
            )
        elif case.investigator_lead:
            lead_out = CaseInvestigatorOut(
                id=case.id,
                case_id=case.id,
                user_id=case.investigator_lead_id,  # type: ignore
                role="INVESTIGATOR_LEAD",
                status="active",
                assigned_at=case.created_at,
                user=UserBrief.model_validate(case.investigator_lead),
            )

        team_investigators: list[CaseInvestigatorOut] = []
        for ia in case.investigator_assignments:
            if ia.role == "INVESTIGATOR" and ia.status == "active":
                team_investigators.append(
                    CaseInvestigatorOut(
                        id=ia.id,
                        case_id=ia.case_id,
                        user_id=ia.user_id,
                        role=ia.role,
                        status=ia.status,
                        assigned_by_id=ia.assigned_by_id,
                        assigned_at=ia.assigned_at,
                        user=UserBrief.model_validate(ia.user) if ia.user else None,
                    )
                )

        total_members = (1 if lead_out else 0) + len(team_investigators)
        return CaseTeamResponse(
            case_id=case.id,
            case_number=case.case_number,
            investigator_lead=lead_out,
            team_investigators=team_investigators,
            total_members=total_members,
        )

    def add_team_investigators(
        self, case_id: UUID, investigator_ids: list[UUID], actor: User
    ) -> CaseTeamResponse:
        case = self.verify_case_access(actor, case_id)
        role = _actor_role(actor)

        # AUTHORIZATION: Only the Investigator Lead or Superior Officer / Admin can add team investigators
        is_lead = case.investigator_lead_id == actor.id
        is_superior_or_admin = role in ("supervisor", "superior_officer", "major_admin", "admin")
        if not (is_lead or is_superior_or_admin):
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                detail="Only the Investigator Lead or a Superior Officer can add investigators to this case team",
            )

        now_dt = datetime.now(timezone.utc)
        chat_svc = ChatService(self.db)
        clean_ids = list(dict.fromkeys(investigator_ids))

        for uid in clean_ids:
            if uid == case.investigator_lead_id:
                continue
            user = self.db.get(User, uid)
            if not user or not user.is_active:
                continue

            existing = next((ia for ia in case.investigator_assignments if ia.user_id == uid), None)
            if existing:
                existing.status = "active"
                existing.role = "INVESTIGATOR"
                existing.assigned_by_id = actor.id
                existing.assigned_at = now_dt
            else:
                new_ia = InvestigatorAssignment(
                    case_id=case.id,
                    user_id=uid,
                    role="INVESTIGATOR",
                    status="active",
                    assigned_by_id=actor.id,
                    assigned_at=now_dt,
                )
                self.db.add(new_ia)

            # Also ensure in case_assignments
            if not any(ca.user_id == uid for ca in case.assignments):
                self.db.add(
                    CaseAssignment(
                        case_id=case.id,
                        user_id=uid,
                        assigned_by_id=actor.id,
                        is_primary=False,
                    )
                )

            # Auto-enroll in case group chat + post system announcement
            chat_svc.add_user_to_case_group(case, user, "investigator", actor)

            # Add Timeline & Activity log
            self.db.add(
                TimelineEvent(
                    case_id=case.id,
                    event_type=TimelineEventType.investigator_assigned,
                    title="Team Investigator Added",
                    description=f"{actor.full_name} added {user.full_name} to the investigation team.",
                    created_by_id=actor.id,
                    event_at=now_dt,
                )
            )
            log_activity(
                self.db,
                user_id=actor.id,
                case_id=case.id,
                actor_role=role,
                action=ActivityAction.assign,
                resource_type="case_investigator",
                resource_id=str(uid),
                description=f"{actor.full_name} added {user.full_name} to team for case {case.case_number}",
            )
            notify(
                self.db,
                user_id=uid,
                notification_type=NotificationType.case_assigned,
                title="Added to Investigation Team",
                message=f"You were added to the investigation team for {case.case_number}: {case.title}",
                link=f"/dashboard/cases/{case.id}",
            )

        case.updated_at = now_dt
        self.db.commit()
        # Refetch refreshed case
        return self.get_team(case_id, actor)

    def remove_team_investigator(
        self, case_id: UUID, user_id: UUID, actor: User
    ) -> CaseTeamResponse:
        case = self.verify_case_access(actor, case_id)
        role = _actor_role(actor)

        # AUTHORIZATION: Only Investigator Lead or Superior Officer / Admin can remove team investigators
        is_lead = case.investigator_lead_id == actor.id
        is_superior_or_admin = role in ("supervisor", "superior_officer", "major_admin", "admin")
        if not (is_lead or is_superior_or_admin):
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                detail="Only the Investigator Lead or a Superior Officer can remove investigators from this team",
            )

        if user_id == case.investigator_lead_id:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove the Investigator Lead using this action. Reassign the Lead role instead.",
            )

        target_ia = next(
            (ia for ia in case.investigator_assignments if ia.user_id == user_id and ia.status == "active"),
            None,
        )
        if not target_ia:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Investigator is not active on this case")

        target_user = self.db.get(User, user_id)
        now_dt = datetime.now(timezone.utc)
        target_ia.status = "removed"

        # Deactivate from group chat while preserving messages
        if target_user:
            chat_svc = ChatService(self.db)
            chat_svc.remove_user_from_case_group(case, target_user, actor)

        # Log timeline & activity
        name_str = target_user.full_name if target_user else str(user_id)
        self.db.add(
            TimelineEvent(
                case_id=case.id,
                event_type=TimelineEventType.case_updated,
                title="Investigator Removed from Team",
                description=f"{actor.full_name} removed {name_str} from the investigation team.",
                created_by_id=actor.id,
                event_at=now_dt,
            )
        )
        log_activity(
            self.db,
            user_id=actor.id,
            case_id=case.id,
            actor_role=role,
            action=ActivityAction.delete,
            resource_type="case_investigator",
            resource_id=str(user_id),
            description=f"{actor.full_name} removed {name_str} from team for case {case.case_number}",
        )

        case.updated_at = now_dt
        self.db.commit()
        return self.get_team(case_id, actor)

    def reassign_lead(
        self,
        case_id: UUID,
        new_lead_id: UUID,
        keep_previous_lead: bool,
        actor: User,
    ) -> CaseTeamResponse:
        case = self.verify_case_access(actor, case_id)
        role = _actor_role(actor)

        # Only Superior Officer / Admin can change the Investigator Lead
        if role not in REVIEWER_ROLES:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                detail="Only a Superior Officer or Administrator can reassign the Investigator Lead",
            )

        new_lead = self.db.get(User, new_lead_id)
        if not new_lead or not new_lead.is_active:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="New lead user not found or inactive")

        old_lead_id = case.investigator_lead_id
        old_lead = self.db.get(User, old_lead_id) if old_lead_id else None
        now_dt = datetime.now(timezone.utc)

        # Update Case model
        case.investigator_lead_id = new_lead_id

        # Update previous lead's role
        if old_lead_id:
            old_ia = next((ia for ia in case.investigator_assignments if ia.user_id == old_lead_id), None)
            if old_ia:
                if keep_previous_lead:
                    old_ia.role = "INVESTIGATOR"
                    old_ia.status = "active"
                else:
                    old_ia.status = "removed"

        # Update / insert new lead's assignment
        new_ia = next((ia for ia in case.investigator_assignments if ia.user_id == new_lead_id), None)
        if new_ia:
            new_ia.role = "INVESTIGATOR_LEAD"
            new_ia.status = "active"
            new_ia.assigned_by_id = actor.id
            new_ia.assigned_at = now_dt
        else:
            self.db.add(
                InvestigatorAssignment(
                    case_id=case.id,
                    user_id=new_lead_id,
                    role="INVESTIGATOR_LEAD",
                    status="active",
                    assigned_by_id=actor.id,
                    assigned_at=now_dt,
                )
            )

        # Synchronize chat group
        chat_svc = ChatService(self.db)
        chat_svc.get_or_create_case_group(case, actor=actor)

        old_name = old_lead.full_name if old_lead else "None"
        desc = f"Superior Officer {actor.full_name} reassigned Investigator Lead from {old_name} to {new_lead.full_name}."
        self.db.add(
            TimelineEvent(
                case_id=case.id,
                event_type=TimelineEventType.investigator_assigned,
                title="Investigator Lead Reassigned",
                description=desc,
                created_by_id=actor.id,
                event_at=now_dt,
            )
        )
        log_activity(
            self.db,
            user_id=actor.id,
            case_id=case.id,
            actor_role=role,
            action=ActivityAction.assign,
            resource_type="case_lead",
            resource_id=str(new_lead_id),
            description=desc,
        )
        notify(
            self.db,
            user_id=new_lead_id,
            notification_type=NotificationType.case_assigned,
            title="Assigned as Investigator Lead",
            message=f"You are now the Investigator Lead for case {case.case_number}: {case.title}",
            link=f"/dashboard/cases/{case.id}",
        )

        case.updated_at = now_dt
        self.db.commit()
        return self.get_team(case_id, actor)

