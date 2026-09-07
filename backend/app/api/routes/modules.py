"""Notes, timeline, relationships, leads nested under cases."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.common import LeadRepository, NoteRepository, RelationshipRepository, TimelineRepository
from app.schemas.domain import (
    LeadCreate,
    LeadOut,
    LeadUpdate,
    NoteCreate,
    NoteOut,
    NoteUpdate,
    RelationshipCreate,
    RelationshipOut,
    TimelineCreate,
    TimelineOut,
)
from app.services.dashboard_service import LeadService, NoteService, RelationshipService, TimelineService

from app.services.case_service import CaseService

router = APIRouter(tags=["case-modules"])


# ---- Notes ----
@router.get("/cases/{case_id}/notes", response_model=list[NoteOut])
def list_notes(case_id: UUID, db: Annotated[Session, Depends(get_db)], user: Annotated[User, Depends(get_current_user)]):
    CaseService(db).verify_case_access(user, case_id)
    return [NoteOut.model_validate(n) for n in NoteRepository(db).list_for_case(case_id)]


@router.post("/cases/{case_id}/notes", response_model=NoteOut, status_code=201)
def create_note(
    case_id: UUID,
    payload: NoteCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    CaseService(db).verify_case_access(user, case_id)
    return NoteOut.model_validate(NoteService(db).create(case_id, payload, user))


@router.patch("/notes/{note_id}", response_model=NoteOut)
def update_note(
    note_id: UUID,
    payload: NoteUpdate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    note = NoteRepository(db).get(note_id)
    if not note:
        from fastapi import HTTPException, status
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Note not found")
    CaseService(db).verify_case_access(user, note.case_id)
    return NoteOut.model_validate(NoteService(db).update(note_id, payload, user))


@router.delete("/notes/{note_id}")
def delete_note(note_id: UUID, db: Annotated[Session, Depends(get_db)], user: Annotated[User, Depends(get_current_user)]):
    note = NoteRepository(db).get(note_id)
    if note:
        CaseService(db).verify_case_access(user, note.case_id)
    NoteService(db).delete(note_id, user)
    return {"success": True}


# ---- Timeline ----
@router.get("/cases/{case_id}/timeline", response_model=list[TimelineOut])
def list_timeline(case_id: UUID, db: Annotated[Session, Depends(get_db)], user: Annotated[User, Depends(get_current_user)]):
    CaseService(db).verify_case_access(user, case_id)
    return [TimelineOut.model_validate(e) for e in TimelineRepository(db).list_for_case(case_id)]


@router.post("/cases/{case_id}/timeline", response_model=TimelineOut, status_code=201)
def create_timeline(
    case_id: UUID,
    payload: TimelineCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    CaseService(db).verify_case_access(user, case_id)
    return TimelineOut.model_validate(TimelineService(db).create(case_id, payload, user))


@router.delete("/timeline/{event_id}")
def delete_timeline(event_id: UUID, db: Annotated[Session, Depends(get_db)], user: Annotated[User, Depends(get_current_user)]):
    event = TimelineRepository(db).get(event_id)
    if event:
        CaseService(db).verify_case_access(user, event.case_id)
    TimelineService(db).delete(event_id)
    return {"success": True}


# ---- Relationships ----
@router.get("/cases/{case_id}/relationships", response_model=list[RelationshipOut])
def list_relationships(case_id: UUID, db: Annotated[Session, Depends(get_db)], user: Annotated[User, Depends(get_current_user)]):
    CaseService(db).verify_case_access(user, case_id)
    return [RelationshipOut.model_validate(r) for r in RelationshipRepository(db).list_for_case(case_id)]


@router.post("/cases/{case_id}/relationships", response_model=RelationshipOut, status_code=201)
def create_relationship(
    case_id: UUID,
    payload: RelationshipCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    CaseService(db).verify_case_access(user, case_id)
    return RelationshipOut.model_validate(RelationshipService(db).create(case_id, payload, user))


@router.delete("/relationships/{rel_id}")
def delete_relationship(rel_id: UUID, db: Annotated[Session, Depends(get_db)], user: Annotated[User, Depends(get_current_user)]):
    rel = RelationshipRepository(db).get(rel_id)
    if rel:
        CaseService(db).verify_case_access(user, rel.case_id)
    RelationshipService(db).delete(rel_id, user)
    return {"success": True}


# ---- Leads ----
@router.get("/cases/{case_id}/leads", response_model=list[LeadOut])
def list_leads(case_id: UUID, db: Annotated[Session, Depends(get_db)], user: Annotated[User, Depends(get_current_user)]):
    CaseService(db).verify_case_access(user, case_id)
    return [LeadOut.model_validate(l) for l in LeadRepository(db).list_for_case(case_id)]


@router.post("/cases/{case_id}/leads", response_model=LeadOut, status_code=201)
def create_lead(
    case_id: UUID,
    payload: LeadCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    CaseService(db).verify_case_access(user, case_id)
    return LeadOut.model_validate(LeadService(db).create(case_id, payload, user))


@router.patch("/leads/{lead_id}", response_model=LeadOut)
def update_lead(lead_id: UUID, payload: LeadUpdate, db: Annotated[Session, Depends(get_db)], user: Annotated[User, Depends(get_current_user)]):
    lead = LeadRepository(db).get(lead_id)
    if lead:
        CaseService(db).verify_case_access(user, lead.case_id)
    return LeadOut.model_validate(LeadService(db).update(lead_id, payload, user))


@router.delete("/leads/{lead_id}")
def delete_lead(lead_id: UUID, db: Annotated[Session, Depends(get_db)], user: Annotated[User, Depends(get_current_user)]):
    lead = LeadRepository(db).get(lead_id)
    if lead:
        CaseService(db).verify_case_access(user, lead.case_id)
    LeadService(db).delete(lead_id, user)
    return {"success": True}

