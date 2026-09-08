"""Chat and Investigator Communication API routes."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.case import Case
from app.models.user import User
from app.schemas.domain import (
    ChatConversationOut,
    ChatMessageCreate,
    ChatMessageOut,
    DirectChatCreate,
)
from app.services.case_service import CaseService
from app.services.chat_service import ChatService

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/conversations", response_model=list[ChatConversationOut])
def list_conversations(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> list[ChatConversationOut]:
    """List all active chat conversations (case groups & direct messages) for the current user."""
    return ChatService(db).list_user_conversations(user)


@router.get("/conversations/{conversation_id}", response_model=ChatConversationOut)
def get_conversation(
    conversation_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> ChatConversationOut:
    """Get conversation details."""
    return ChatService(db).get_conversation_details(conversation_id, user)


@router.get("/conversations/{conversation_id}/messages", response_model=list[ChatMessageOut])
def list_messages(
    conversation_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
    limit: int = Query(default=100, ge=1, le=500),
) -> list[ChatMessageOut]:
    """Retrieve message history for a conversation and mark as read."""
    return ChatService(db).list_messages(conversation_id, user, limit=limit)


@router.post("/conversations/{conversation_id}/messages", response_model=ChatMessageOut)
def send_message(
    conversation_id: UUID,
    payload: ChatMessageCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> ChatMessageOut:
    """Send a message to a conversation."""
    return ChatService(db).send_message(conversation_id, payload.content, user)


@router.post("/direct", response_model=ChatConversationOut)
def get_or_create_direct_chat(
    payload: DirectChatCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> ChatConversationOut:
    """Initiate or get an existing 1-on-1 direct chat with another investigator."""
    return ChatService(db).get_or_create_direct_chat(
        target_user_id=payload.target_user_id,
        actor=user,
        case_id=payload.case_id,
    )


@router.post("/conversations/{conversation_id}/read")
def mark_conversation_as_read(
    conversation_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> dict:
    """Mark all messages in a conversation as read."""
    return ChatService(db).mark_as_read(conversation_id, user)


@router.get("/case/{case_id}/group", response_model=ChatConversationOut)
@router.get("/case-group/{case_id}", response_model=ChatConversationOut)
@router.get("/case/{case_id}", response_model=ChatConversationOut)
def get_case_group_chat(
    case_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> ChatConversationOut:
    """Get or initialize the official Investigation Team group chat for a specific case."""
    case = CaseService(db).verify_case_access(user, case_id)
    conv = ChatService(db).get_or_create_case_group(case, actor=user)
    return ChatService(db).get_conversation_details(conv.id, user)


@router.get("/contacts", response_model=list[UserBrief])
def list_chat_contacts(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> list[UserBrief]:
    """Retrieve all available investigators, leads, and superiors for direct messaging."""
    from sqlalchemy import select
    from app.schemas.domain import UserBrief

    stmt = select(User).where(User.is_active.is_(True)).order_by(User.full_name.asc())
    users = db.scalars(stmt).all()
    return [UserBrief.model_validate(u) for u in users]

