"""Case management API."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.enums import CasePriority, CaseStatus
from app.models.user import User
from app.schemas.domain import CaseAssign, CaseCreate, CaseOut, CaseReviewRequest, CaseUpdate, PageOut
from app.services.case_service import CaseService
from app.utils.pagination import paginate

router = APIRouter(prefix="/cases", tags=["cases"])


@router.get("", response_model=PageOut[CaseOut])
def list_cases(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
    q: str | None = None,
    status: CaseStatus | None = None,
    priority: CasePriority | None = None,
    assigned_to: UUID | None = None,
    sort_by: str = Query(default="updated_at"),
    sort_dir: str = Query(default="desc", pattern="^(asc|desc)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> PageOut[CaseOut]:
    items, total = CaseService(db).list(
        actor=user,
        q=q,
        status=status,
        priority=priority,
        assigned_to=assigned_to,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        page_size=page_size,
    )
    return paginate(total, page, page_size, [CaseOut.model_validate(i) for i in items])


@router.post("", response_model=CaseOut, status_code=201)
def create_case(
    payload: CaseCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> CaseOut:
    return CaseOut.model_validate(CaseService(db).create(payload, user))


@router.get("/{case_id}", response_model=CaseOut)
def get_case(
    case_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> CaseOut:
    return CaseOut.model_validate(CaseService(db).get(case_id, actor=user))


@router.patch("/{case_id}", response_model=CaseOut)
def update_case(
    case_id: UUID,
    payload: CaseUpdate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> CaseOut:
    return CaseOut.model_validate(CaseService(db).update(case_id, payload, user))


@router.delete("/{case_id}")
def delete_case(
    case_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> dict:
    CaseService(db).delete(case_id, user)
    return {"success": True, "message": "Case deleted"}


@router.post("/{case_id}/assign", response_model=CaseOut)
def assign_case(
    case_id: UUID,
    payload: CaseAssign,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> CaseOut:
    return CaseOut.model_validate(CaseService(db).assign(case_id, payload, user))


@router.post("/{case_id}/submit-review", response_model=CaseOut)
def submit_case_for_review(
    case_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> CaseOut:
    return CaseOut.model_validate(CaseService(db).submit_for_review(case_id, user))


@router.post("/{case_id}/review", response_model=CaseOut)
def review_case(
    case_id: UUID,
    payload: CaseReviewRequest,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> CaseOut:
    return CaseOut.model_validate(
        CaseService(db).review_case(
            case_id=case_id,
            action=payload.action,
            review_comment=payload.review_comment,
            actor=user,
        )
    )


@router.post("/{case_id}/close", response_model=CaseOut)
def close_case(
    case_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> CaseOut:
    return CaseOut.model_validate(CaseService(db).close_case(case_id, user))

