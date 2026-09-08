"""Case repository — data access for investigation cases."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.case import Case, CaseAssignment, InvestigatorAssignment
from app.models.enums import CasePriority, CaseStatus


class CaseRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, case_id: UUID) -> Case | None:
        return self.db.scalar(
            select(Case)
            .options(
                selectinload(Case.assignments).joinedload(CaseAssignment.user),
                selectinload(Case.investigator_assignments).joinedload(InvestigatorAssignment.user),
                joinedload(Case.created_by),
                joinedload(Case.supervisor),
                joinedload(Case.investigator_lead),
            )
            .where(Case.id == case_id)
        )

    def get_by_number(self, case_number: str) -> Case | None:
        return self.db.scalar(select(Case).where(Case.case_number == case_number))

    def list(
        self,
        *,
        q: str | None = None,
        status: CaseStatus | None = None,
        priority: CasePriority | None = None,
        assigned_to: UUID | None = None,
        user_id: UUID | None = None,
        user_role: str | None = None,
        user_department_id: UUID | None = None,
        sort_by: str = "updated_at",
        sort_dir: str = "desc",
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[list[Case], int]:
        stmt = select(Case).options(
            selectinload(Case.assignments).joinedload(CaseAssignment.user),
            selectinload(Case.investigator_assignments).joinedload(InvestigatorAssignment.user),
            joinedload(Case.created_by),
            joinedload(Case.supervisor),
            joinedload(Case.investigator_lead),
        )
        count_stmt = select(func.count()).select_from(Case)

        if user_role and user_id and user_role not in ("major_admin", "admin"):
            assigned_subquery = select(CaseAssignment.case_id).where(CaseAssignment.user_id == user_id)
            inv_assigned_subquery = select(InvestigatorAssignment.case_id).where(
                InvestigatorAssignment.user_id == user_id,
                InvestigatorAssignment.status == "active",
            )
            if user_role in ("supervisor", "superior_officer"):
                scope_filter = or_(
                    Case.created_by_id == user_id,
                    Case.supervisor_id == user_id,
                    Case.investigator_lead_id == user_id,
                    Case.id.in_(assigned_subquery),
                    Case.id.in_(inv_assigned_subquery),
                    Case.department_id == user_department_id if user_department_id else False,
                )
            else:  # investigator
                scope_filter = or_(
                    Case.created_by_id == user_id,
                    Case.investigator_lead_id == user_id,
                    Case.id.in_(assigned_subquery),
                    Case.id.in_(inv_assigned_subquery),
                )
            stmt = stmt.where(scope_filter)
            count_stmt = count_stmt.where(scope_filter)

        if q:
            like = f"%{q}%"
            filt = or_(Case.title.ilike(like), Case.case_number.ilike(like), Case.description.ilike(like))
            stmt = stmt.where(filt)
            count_stmt = count_stmt.where(filt)
        if status:
            stmt = stmt.where(Case.status == status)
            count_stmt = count_stmt.where(Case.status == status)
        if priority:
            stmt = stmt.where(Case.priority == priority)
            count_stmt = count_stmt.where(Case.priority == priority)
        if assigned_to:
            sub = select(CaseAssignment.case_id).where(CaseAssignment.user_id == assigned_to)
            inv_sub = select(InvestigatorAssignment.case_id).where(
                InvestigatorAssignment.user_id == assigned_to,
                InvestigatorAssignment.status == "active",
            )
            filt = or_(Case.investigator_lead_id == assigned_to, Case.id.in_(sub), Case.id.in_(inv_sub))
            stmt = stmt.where(filt)
            count_stmt = count_stmt.where(filt)

        sort_col = {
            "created_at": Case.created_at,
            "updated_at": Case.updated_at,
            "title": Case.title,
            "priority": Case.priority,
            "status": Case.status,
            "case_number": Case.case_number,
        }.get(sort_by, Case.updated_at)
        stmt = stmt.order_by(sort_col.desc() if sort_dir == "desc" else sort_col.asc())
        total = self.db.scalar(count_stmt) or 0
        items = list(self.db.scalars(stmt.offset(offset).limit(limit)).unique().all())
        return items, total

    def add(self, case: Case) -> Case:
        self.db.add(case)
        return case

    def delete(self, case: Case) -> None:
        self.db.delete(case)

    def next_case_number(self) -> str:
        year = func.to_char(func.now(), "YYYY")
        # Simple sequential: CS-YYYY-NNNN based on count
        count = self.db.scalar(select(func.count()).select_from(Case)) or 0
        from datetime import datetime, timezone

        y = datetime.now(timezone.utc).year
        return f"CS-{y}-{count + 1:04d}"
