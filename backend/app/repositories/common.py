"""Generic CRUD-style repositories for notes, timeline, relationships, leads, etc."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.audit import ActivityLog, Notification, Report
from app.models.lead import ManualLead
from app.models.note import Note
from app.models.relationship import Relationship
from app.models.timeline import TimelineEvent
from app.models.user import User


class NoteRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_case(self, case_id: UUID) -> list[Note]:
        stmt = (
            select(Note)
            .options(joinedload(Note.author))
            .where(Note.case_id == case_id)
            .order_by(Note.is_pinned.desc(), Note.updated_at.desc())
        )
        return list(self.db.scalars(stmt).unique().all())

    def get(self, note_id: UUID) -> Note | None:
        return self.db.scalar(select(Note).options(joinedload(Note.author)).where(Note.id == note_id))

    def search(self, q: str, *, limit: int = 20) -> list[Note]:
        like = f"%{q}%"
        stmt = (
            select(Note)
            .where(or_(Note.title.ilike(like), Note.body.ilike(like)))
            .order_by(Note.updated_at.desc())
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())


class TimelineRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_case(self, case_id: UUID) -> list[TimelineEvent]:
        stmt = (
            select(TimelineEvent)
            .options(joinedload(TimelineEvent.created_by))
            .where(TimelineEvent.case_id == case_id)
            .order_by(TimelineEvent.event_at.asc())
        )
        return list(self.db.scalars(stmt).unique().all())

    def get(self, event_id: UUID) -> TimelineEvent | None:
        return self.db.get(TimelineEvent, event_id)


class RelationshipRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_case(self, case_id: UUID) -> list[Relationship]:
        stmt = (
            select(Relationship)
            .where(Relationship.case_id == case_id)
            .order_by(Relationship.created_at.desc())
        )
        return list(self.db.scalars(stmt).all())

    def get(self, rel_id: UUID) -> Relationship | None:
        return self.db.get(Relationship, rel_id)


class LeadRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_case(self, case_id: UUID) -> list[ManualLead]:
        stmt = (
            select(ManualLead)
            .options(joinedload(ManualLead.assigned_to), joinedload(ManualLead.created_by))
            .where(ManualLead.case_id == case_id)
            .order_by(ManualLead.updated_at.desc())
        )
        return list(self.db.scalars(stmt).unique().all())

    def get(self, lead_id: UUID) -> ManualLead | None:
        return self.db.get(ManualLead, lead_id)


class NotificationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_user(self, user_id: UUID, *, unread_only: bool = False, limit: int = 50) -> list[Notification]:
        stmt = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            stmt = stmt.where(Notification.is_read.is_(False))
        stmt = stmt.order_by(Notification.created_at.desc()).limit(limit)
        return list(self.db.scalars(stmt).all())

    def get(self, notification_id: UUID) -> Notification | None:
        return self.db.get(Notification, notification_id)

    def unread_count(self, user_id: UUID) -> int:
        return (
            self.db.scalar(
                select(func.count()).select_from(Notification).where(
                    Notification.user_id == user_id, Notification.is_read.is_(False)
                )
            )
            or 0
        )


class ActivityRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(
        self, *, offset: int = 0, limit: int = 50, case_id: UUID | None = None
    ) -> tuple[list[ActivityLog], int]:
        count_stmt = select(func.count()).select_from(ActivityLog)
        stmt = select(ActivityLog).options(joinedload(ActivityLog.user))
        if case_id:
            count_stmt = count_stmt.where(ActivityLog.case_id == case_id)
            stmt = stmt.where(ActivityLog.case_id == case_id)
        total = self.db.scalar(count_stmt) or 0
        stmt = stmt.order_by(ActivityLog.created_at.desc()).offset(offset).limit(limit)
        return list(self.db.scalars(stmt).unique().all()), total


class ReportRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_case(self, case_id: UUID) -> list[Report]:
        stmt = select(Report).where(Report.case_id == case_id).order_by(Report.created_at.desc())
        return list(self.db.scalars(stmt).all())

    def get(self, report_id: UUID) -> Report | None:
        return self.db.get(Report, report_id)

    def search(self, q: str, *, limit: int = 20) -> list[Report]:
        like = f"%{q}%"
        stmt = select(Report).where(Report.title.ilike(like)).order_by(Report.created_at.desc()).limit(limit)
        return list(self.db.scalars(stmt).all())


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, user_id: UUID) -> User | None:
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        return self.db.scalar(select(User).where(User.email == email.lower()))

    def list(self, *, q: str | None = None, offset: int = 0, limit: int = 50) -> tuple[list[User], int]:
        stmt = select(User)
        count_stmt = select(func.count()).select_from(User)
        if q:
            like = f"%{q}%"
            filt = or_(User.full_name.ilike(like), User.email.ilike(like))
            stmt = stmt.where(filt)
            count_stmt = count_stmt.where(filt)
        total = self.db.scalar(count_stmt) or 0
        items = list(self.db.scalars(stmt.order_by(User.created_at.desc()).offset(offset).limit(limit)).all())
        return items, total

    def search(self, q: str, *, limit: int = 20) -> list[User]:
        like = f"%{q}%"
        stmt = (
            select(User)
            .where(or_(User.full_name.ilike(like), User.email.ilike(like)))
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())
