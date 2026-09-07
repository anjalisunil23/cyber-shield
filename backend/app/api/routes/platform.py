"""Reports, notifications, activity, search, dashboard, admin users."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User
from app.repositories.common import ActivityRepository, NotificationRepository, ReportRepository, UserRepository
from app.schemas.domain import (
    ActivityOut,
    AdminUserUpdate,
    DashboardStats,
    NotificationOut,
    PageOut,
    ReportCreate,
    ReportOut,
    SearchResult,
)
from app.schemas.user import UserRegister, UserResponse
from app.services.dashboard_service import DashboardService, ReportService, SearchService
from app.utils.pagination import paginate

router = APIRouter(tags=["platform"])


@router.get("/dashboard/stats", response_model=DashboardStats)
def dashboard_stats(db: Annotated[Session, Depends(get_db)], _: Annotated[User, Depends(get_current_user)]):
    return DashboardService(db).stats()


@router.get("/search", response_model=SearchResult)
def global_search(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
    q: str = Query(..., min_length=1),
):
    return SearchService(db).search(q)


@router.get("/notifications", response_model=list[NotificationOut])
def list_notifications(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
    unread_only: bool = False,
):
    items = NotificationRepository(db).list_for_user(user.id, unread_only=unread_only)
    return [NotificationOut.model_validate(n) for n in items]


@router.get("/notifications/unread-count")
def unread_count(db: Annotated[Session, Depends(get_db)], user: Annotated[User, Depends(get_current_user)]):
    return {"count": NotificationRepository(db).unread_count(user.id)}


@router.post("/notifications/{notification_id}/read")
def mark_read(
    notification_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    n = NotificationRepository(db).get(notification_id)
    if n and n.user_id == user.id:
        n.is_read = True
        db.add(n)
        db.commit()
    return {"success": True}


@router.post("/notifications/read-all")
def mark_all_read(db: Annotated[Session, Depends(get_db)], user: Annotated[User, Depends(get_current_user)]):
    for n in NotificationRepository(db).list_for_user(user.id, unread_only=True, limit=500):
        n.is_read = True
        db.add(n)
    db.commit()
    return {"success": True}


@router.get("/activity", response_model=PageOut[ActivityOut])
def list_activity(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    case_id: UUID | None = None,
):
    items, total = ActivityRepository(db).list(
        offset=(page - 1) * page_size, limit=page_size, case_id=case_id
    )
    return paginate(total, page, page_size, [ActivityOut.model_validate(i) for i in items])


from app.services.case_service import CaseService


@router.post("/cases/{case_id}/reports", response_model=ReportOut, status_code=201)
def create_report(
    case_id: UUID,
    payload: ReportCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    CaseService(db).verify_case_access(user, case_id)
    return ReportOut.model_validate(ReportService(db).generate(case_id, payload, user))


@router.get("/cases/{case_id}/reports", response_model=list[ReportOut])
def list_reports(case_id: UUID, db: Annotated[Session, Depends(get_db)], user: Annotated[User, Depends(get_current_user)]):
    CaseService(db).verify_case_access(user, case_id)
    return [ReportOut.model_validate(r) for r in ReportRepository(db).list_for_case(case_id)]


@router.get("/reports/{report_id}", response_model=ReportOut)
def get_report(report_id: UUID, db: Annotated[Session, Depends(get_db)], user: Annotated[User, Depends(get_current_user)]):
    r = ReportRepository(db).get(report_id)
    if not r:
        from fastapi import HTTPException
        raise HTTPException(404, detail="Report not found")
    CaseService(db).verify_case_access(user, r.case_id)
    return ReportOut.model_validate(r)


@router.get("/reports/{report_id}/export")
def export_report(report_id: UUID, db: Annotated[Session, Depends(get_db)], user: Annotated[User, Depends(get_current_user)]):
    r = ReportRepository(db).get(report_id)
    if not r or not r.content:
        from fastapi import HTTPException
        raise HTTPException(404, detail="Report not found")
    CaseService(db).verify_case_access(user, r.case_id)
    media = "text/csv" if r.format.value == "csv" else "text/html"
    return PlainTextResponse(r.content, media_type=media)


@router.get("/users", response_model=PageOut[UserResponse])
def list_users(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
    q: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
):
    items, total = UserRepository(db).list(q=q, offset=(page - 1) * page_size, limit=page_size)
    return paginate(total, page, page_size, [UserResponse.model_validate(u) for u in items])


@router.patch("/admin/users/{user_id}", response_model=UserResponse)
def admin_update_user(
    user_id: UUID,
    payload: AdminUserUpdate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_role(["major_admin", "admin"]))],
):
    from fastapi import HTTPException

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, detail="User not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(user, k, v)
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.post("/admin/users", response_model=UserResponse, status_code=201)
def admin_create_user(
    payload: UserRegister,
    db: Annotated[Session, Depends(get_db)],
    actor: Annotated[User, Depends(require_role(["major_admin", "admin"]))],
):
    """Create a user with role constraints based on actor."""
    from fastapi import HTTPException
    from sqlalchemy import select

    from app.core.security import hash_password
    from app.models.user import UserRole

    # Role hierarchy: major_admin can create anyone; admin cannot create major_admin
    if actor.role.value == "admin" and payload.role.value == "major_admin":
        raise HTTPException(403, detail="Admins cannot create Major Admin accounts")
    if actor.role.value == "admin" and payload.role.value == "admin":
        raise HTTPException(403, detail="Only Major Admin can create Admin accounts")

    existing = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing:
        raise HTTPException(409, detail="Email already registered")

    user = User(
        full_name=payload.full_name.strip(),
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=payload.role,
        department=payload.department.strip() if payload.department else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.get("/admin/activity", response_model=PageOut[ActivityOut])
def admin_activity(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_role(["major_admin", "admin"]))],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
):
    items, total = ActivityRepository(db).list(offset=(page - 1) * page_size, limit=page_size)
    return paginate(total, page, page_size, [ActivityOut.model_validate(i) for i in items])


@router.get("/departments")
def list_departments(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
):
    from app.models.department import Department
    from sqlalchemy import select

    rows = list(db.scalars(select(Department).order_by(Department.name)).all())
    return [
        {
            "id": str(d.id),
            "name": d.name,
            "code": d.code,
            "description": d.description,
            "is_active": d.is_active,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in rows
    ]


@router.post("/departments", status_code=201)
def create_department(
    payload: dict,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_role(["major_admin"]))],
):
    import uuid

    from app.models.department import Department

    d = Department(
        id=uuid.uuid4(),
        name=str(payload.get("name", "")).strip(),
        code=(str(payload["code"]).strip() if payload.get("code") else None),
        description=payload.get("description"),
    )
    if not d.name:
        from fastapi import HTTPException

        raise HTTPException(400, detail="Name is required")
    db.add(d)
    db.commit()
    db.refresh(d)
    return {"id": str(d.id), "name": d.name, "code": d.code, "description": d.description, "is_active": d.is_active}
