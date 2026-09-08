"""Chat and Investigator Communication domain service."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Sequence
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.case import Case, InvestigatorAssignment
from app.models.chat import ChatConversation, ChatMessage, ChatParticipant
from app.models.enums import NotificationType
from app.models.user import User, UserRole
from app.schemas.domain import (
    ChatConversationOut,
    ChatMessageOut,
    ChatParticipantOut,
    UserBrief,
)
from app.services.notifications import notify


class ChatService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_or_create_case_group(self, case: Case, actor: User | None = None) -> ChatConversation:
        """Finds or initializes the official Investigation Team group chat for a case."""
        conv = self.db.scalars(
            select(ChatConversation)
            .where(
                ChatConversation.case_id == case.id,
                ChatConversation.type == "case_group",
            )
            .options(
                selectinload(ChatConversation.participants).joinedload(ChatParticipant.user),
                selectinload(ChatConversation.messages).joinedload(ChatMessage.sender),
            )
        ).first()

        now_dt = datetime.now(timezone.utc)
        if not conv:
            conv = ChatConversation(
                case_id=case.id,
                type="case_group",
                title=f"{case.case_number} Investigation Team",
                created_by_id=actor.id if actor else case.created_by_id,
                created_at=now_dt,
                updated_at=now_dt,
            )
            self.db.add(conv)
            self.db.flush()

        existing_parts = self.db.scalars(
            select(ChatParticipant).where(ChatParticipant.conversation_id == conv.id)
        ).all()
        part_map = {p.user_id: p for p in existing_parts}

        # Ensure lead is in the group chat
        if case.investigator_lead_id:
            lead_part = part_map.get(case.investigator_lead_id)
            if not lead_part:
                new_lead_part = ChatParticipant(
                    conversation_id=conv.id,
                    user_id=case.investigator_lead_id,
                    role_in_case="lead",
                    is_active=True,
                    joined_at=now_dt,
                    last_read_at=now_dt,
                )
                self.db.add(new_lead_part)
                part_map[case.investigator_lead_id] = new_lead_part
            else:
                lead_part.role_in_case = "lead"
                lead_part.is_active = True

        # Ensure supervisor is enrolled in the group chat
        if case.supervisor_id:
            sup_part = part_map.get(case.supervisor_id)
            if not sup_part:
                new_sup_part = ChatParticipant(
                    conversation_id=conv.id,
                    user_id=case.supervisor_id,
                    role_in_case="supervisor",
                    is_active=True,
                    joined_at=now_dt,
                    last_read_at=now_dt,
                )
                self.db.add(new_sup_part)
                part_map[case.supervisor_id] = new_sup_part
            else:
                sup_part.role_in_case = "supervisor"
                sup_part.is_active = True

        # Ensure all active assigned investigators are in the group chat
        stmt = select(InvestigatorAssignment).where(
            InvestigatorAssignment.case_id == case.id,
            InvestigatorAssignment.status == "active",
        )
        active_assignments = self.db.scalars(stmt).all()
        for assign in active_assignments:
            p = part_map.get(assign.user_id)
            role_tag = "lead" if assign.role == "INVESTIGATOR_LEAD" else "investigator"
            if not p:
                new_p = ChatParticipant(
                    conversation_id=conv.id,
                    user_id=assign.user_id,
                    role_in_case=role_tag,
                    is_active=True,
                    joined_at=now_dt,
                    last_read_at=now_dt,
                )
                self.db.add(new_p)
                part_map[assign.user_id] = new_p
            else:
                p.role_in_case = role_tag
                p.is_active = True

        # If actor is supervisor / creator / admin, also ensure they are in part_map
        if actor and actor.id not in part_map:
            act_role = actor.role.value if hasattr(actor.role, "value") else str(actor.role)
            new_act_part = ChatParticipant(
                conversation_id=conv.id,
                user_id=actor.id,
                role_in_case=act_role,
                is_active=True,
                joined_at=now_dt,
                last_read_at=now_dt,
            )
            self.db.add(new_act_part)
            part_map[actor.id] = new_act_part

        self.db.flush()
        return conv

    def add_user_to_case_group(self, case: Case, user: User, role_tag: str, actor: User) -> None:
        """Adds an investigator to the case group chat and records a system announcement."""
        conv = self.get_or_create_case_group(case, actor=actor)
        now_dt = datetime.now(timezone.utc)

        p = self.db.scalars(
            select(ChatParticipant).where(
                ChatParticipant.conversation_id == conv.id,
                ChatParticipant.user_id == user.id,
            )
        ).first()

        if not p:
            self.db.add(
                ChatParticipant(
                    conversation_id=conv.id,
                    user_id=user.id,
                    role_in_case=role_tag,
                    is_active=True,
                    joined_at=now_dt,
                    last_read_at=now_dt,
                )
            )
        else:
            p.role_in_case = role_tag
            p.is_active = True
            p.left_at = None

        # System message
        system_msg = ChatMessage(
            conversation_id=conv.id,
            sender_id=None,
            content=f"{actor.full_name} added {user.full_name} to the investigation team.",
            is_system=True,
            created_at=now_dt,
        )
        self.db.add(system_msg)
        conv.updated_at = now_dt
        self.db.flush()

    def remove_user_from_case_group(self, case: Case, user: User, actor: User) -> None:
        """Deactivates investigator's participation while preserving historical messages."""
        conv = self.get_or_create_case_group(case, actor=actor)
        now_dt = datetime.now(timezone.utc)

        p = self.db.scalars(
            select(ChatParticipant).where(
                ChatParticipant.conversation_id == conv.id,
                ChatParticipant.user_id == user.id,
            )
        ).first()

        if p and p.is_active:
            p.is_active = False
            p.left_at = now_dt

            # System message
            system_msg = ChatMessage(
                conversation_id=conv.id,
                sender_id=None,
                content=f"{actor.full_name} removed {user.full_name} from the investigation team.",
                is_system=True,
                created_at=now_dt,
            )
            self.db.add(system_msg)
            conv.updated_at = now_dt
            self.db.flush()

    def list_user_conversations(self, actor: User) -> list[ChatConversationOut]:
        """Returns all active conversations for the actor (Case Groups & Direct Messages)."""
        role_str = actor.role.value if hasattr(actor.role, "value") else str(actor.role)
        is_admin_or_supervisor = role_str in ("major_admin", "admin", "supervisor", "superior_officer")

        # Automatically ensure case group chats exist for all cases accessible to actor
        try:
            if is_admin_or_supervisor:
                cases = self.db.scalars(select(Case).where(Case.status != "archived")).all()
            else:
                assigned_stmt = select(InvestigatorAssignment.case_id).where(
                    InvestigatorAssignment.user_id == actor.id,
                    InvestigatorAssignment.status == "active",
                )
                cases = self.db.scalars(
                    select(Case).where(
                        or_(
                            Case.investigator_lead_id == actor.id,
                            Case.supervisor_id == actor.id,
                            Case.created_by_id == actor.id,
                            Case.id.in_(assigned_stmt),
                        )
                    )
                ).all()

            for c in cases:
                self.get_or_create_case_group(c, actor=actor)
            self.db.commit()
        except Exception:
            self.db.rollback()

        # 1. Fetch conversations where user is an active participant
        stmt = (
            select(ChatConversation)
            .join(ChatParticipant, ChatParticipant.conversation_id == ChatConversation.id)
            .where(
                ChatParticipant.user_id == actor.id,
                ChatParticipant.is_active.is_(True),
            )
            .options(
                joinedload(ChatConversation.case),
                selectinload(ChatConversation.participants).joinedload(ChatParticipant.user),
                selectinload(ChatConversation.messages).joinedload(ChatMessage.sender),
            )
            .order_by(ChatConversation.updated_at.desc())
        )
        conversations = self.db.scalars(stmt).unique().all()

        results: list[ChatConversationOut] = []
        for conv in conversations:
            part = next((p for p in conv.participants if p.user_id == actor.id), None)
            last_read = part.last_read_at if part else datetime.min.replace(tzinfo=timezone.utc)

            # Unread count
            unread_count = 0
            if last_read:
                for msg in conv.messages:
                    if msg.sender_id != actor.id and msg.created_at > last_read:
                        unread_count += 1

            # Last message
            last_msg_out: ChatMessageOut | None = None
            if conv.messages:
                last_msg = conv.messages[-1]
                last_msg_out = ChatMessageOut(
                    id=last_msg.id,
                    conversation_id=last_msg.conversation_id,
                    sender_id=last_msg.sender_id,
                    content=last_msg.content,
                    is_system=last_msg.is_system,
                    created_at=last_msg.created_at,
                    sender=UserBrief.model_validate(last_msg.sender) if last_msg.sender else None,
                )

            # Dynamic title for direct chats from actor perspective
            conv_title = conv.title
            if conv.type == "direct":
                other_part = next((p for p in conv.participants if p.user_id != actor.id), None)
                if other_part and other_part.user:
                    conv_title = other_part.user.full_name

            participants_out = [
                ChatParticipantOut(
                    id=p.id,
                    conversation_id=p.conversation_id,
                    user_id=p.user_id,
                    role_in_case=p.role_in_case,
                    is_active=p.is_active,
                    joined_at=p.joined_at,
                    left_at=p.left_at,
                    last_read_at=p.last_read_at,
                    user=UserBrief.model_validate(p.user) if p.user else None,
                )
                for p in conv.participants
                if p.is_active
            ]

            results.append(
                ChatConversationOut(
                    id=conv.id,
                    case_id=conv.case_id,
                    type=conv.type,
                    title=conv_title,
                    created_by_id=conv.created_by_id,
                    created_at=conv.created_at,
                    updated_at=conv.updated_at,
                    case_number=conv.case.case_number if conv.case else None,
                    participants=participants_out,
                    last_message=last_msg_out,
                    unread_count=unread_count,
                )
            )

        return results

    def verify_conversation_access(self, conversation_id: UUID, actor: User) -> tuple[ChatConversation, ChatParticipant | None]:
        """Checks if actor has active access to conversation."""
        conv = self.db.scalars(
            select(ChatConversation)
            .where(ChatConversation.id == conversation_id)
            .options(
                joinedload(ChatConversation.case),
                selectinload(ChatConversation.participants).joinedload(ChatParticipant.user),
            )
        ).first()

        if not conv:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Conversation not found")

        part = next((p for p in conv.participants if p.user_id == actor.id), None)
        role_str = actor.role.value if hasattr(actor.role, "value") else str(actor.role)
        is_admin_or_supervisor = role_str in ("major_admin", "admin", "supervisor", "superior_officer")

        if not part or not part.is_active:
            if conv.type == "case_group" and (is_admin_or_supervisor or (conv.case and (conv.case.supervisor_id == actor.id or conv.case.created_by_id == actor.id))):
                now_dt = datetime.now(timezone.utc)
                if not part:
                    part = ChatParticipant(
                        conversation_id=conv.id,
                        user_id=actor.id,
                        role_in_case=role_str,
                        is_active=True,
                        joined_at=now_dt,
                        last_read_at=now_dt,
                    )
                    self.db.add(part)
                    self.db.flush()
                else:
                    part.is_active = True
                    self.db.flush()
            elif not is_admin_or_supervisor:
                raise HTTPException(status.HTTP_403_FORBIDDEN, detail="You do not have access to this conversation")

        return conv, part

    def get_conversation_details(self, conversation_id: UUID, actor: User) -> ChatConversationOut:
        conv, part = self.verify_conversation_access(conversation_id, actor)
        messages_stmt = (
            select(ChatMessage)
            .where(ChatMessage.conversation_id == conv.id)
            .options(joinedload(ChatMessage.sender))
            .order_by(ChatMessage.created_at.desc())
            .limit(1)
        )
        last_msg = self.db.scalars(messages_stmt).first()
        last_msg_out = (
            ChatMessageOut(
                id=last_msg.id,
                conversation_id=last_msg.conversation_id,
                sender_id=last_msg.sender_id,
                content=last_msg.content,
                is_system=last_msg.is_system,
                created_at=last_msg.created_at,
                sender=UserBrief.model_validate(last_msg.sender) if last_msg.sender else None,
            )
            if last_msg
            else None
        )

        conv_title = conv.title
        if conv.type == "direct":
            other_part = next((p for p in conv.participants if p.user_id != actor.id), None)
            if other_part and other_part.user:
                conv_title = other_part.user.full_name

        return ChatConversationOut(
            id=conv.id,
            case_id=conv.case_id,
            type=conv.type,
            title=conv_title,
            created_by_id=conv.created_by_id,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            case_number=conv.case.case_number if conv.case else None,
            participants=[
                ChatParticipantOut(
                    id=p.id,
                    conversation_id=p.conversation_id,
                    user_id=p.user_id,
                    role_in_case=p.role_in_case,
                    is_active=p.is_active,
                    joined_at=p.joined_at,
                    left_at=p.left_at,
                    last_read_at=p.last_read_at,
                    user=UserBrief.model_validate(p.user) if p.user else None,
                )
                for p in conv.participants
                if p.is_active
            ],
            last_message=last_msg_out,
            unread_count=0,
        )

    def list_messages(
        self,
        conversation_id: UUID,
        actor: User,
        limit: int = 100,
    ) -> list[ChatMessageOut]:
        conv, part = self.verify_conversation_access(conversation_id, actor)

        # Mark conversation as read for actor
        now_dt = datetime.now(timezone.utc)
        if part:
            part.last_read_at = now_dt
            self.db.commit()

        stmt = (
            select(ChatMessage)
            .where(ChatMessage.conversation_id == conversation_id)
            .options(joinedload(ChatMessage.sender))
            .order_by(ChatMessage.created_at.asc())
            .limit(limit)
        )
        messages = self.db.scalars(stmt).all()
        return [
            ChatMessageOut(
                id=m.id,
                conversation_id=m.conversation_id,
                sender_id=m.sender_id,
                content=m.content,
                is_system=m.is_system,
                created_at=m.created_at,
                sender=UserBrief.model_validate(m.sender) if m.sender else None,
            )
            for m in messages
        ]

    def send_message(self, conversation_id: UUID, content: str, actor: User) -> ChatMessageOut:
        conv, part = self.verify_conversation_access(conversation_id, actor)

        clean_text = content.strip()
        if not clean_text:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Message content cannot be empty")

        now_dt = datetime.now(timezone.utc)
        msg = ChatMessage(
            conversation_id=conversation_id,
            sender_id=actor.id,
            content=clean_text,
            is_system=False,
            created_at=now_dt,
        )
        self.db.add(msg)
        conv.updated_at = now_dt
        if part:
            part.last_read_at = now_dt

        # Notify other active participants
        for p in conv.participants:
            if p.user_id != actor.id and p.is_active:
                notify(
                    self.db,
                    user_id=p.user_id,
                    notification_type=NotificationType.general,
                    title=f"New message from {actor.full_name}",
                    message=f"{conv.title}: {clean_text[:60]}",
                    link=f"/dashboard/messages?conv={conv.id}",
                )

        self.db.commit()
        self.db.refresh(msg)

        return ChatMessageOut(
            id=msg.id,
            conversation_id=msg.conversation_id,
            sender_id=msg.sender_id,
            content=msg.content,
            is_system=msg.is_system,
            created_at=msg.created_at,
            sender=UserBrief.model_validate(actor),
        )

    def get_or_create_direct_chat(
        self,
        target_user_id: UUID,
        actor: User,
        case_id: UUID | None = None,
    ) -> ChatConversationOut:
        if target_user_id == actor.id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Cannot create direct message with yourself")

        target_user = self.db.get(User, target_user_id)
        if not target_user or not target_user.is_active:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Target user not found")

        # Check if direct conversation already exists between actor and target_user
        # Find conversation of type 'direct' where both users are participants
        convs = self.db.scalars(
            select(ChatConversation)
            .where(ChatConversation.type == "direct")
            .options(
                joinedload(ChatConversation.case),
                selectinload(ChatConversation.participants).joinedload(ChatParticipant.user),
            )
        ).all()

        existing_conv: ChatConversation | None = None
        for c in convs:
            uids = {p.user_id for p in c.participants}
            if actor.id in uids and target_user_id in uids:
                if case_id is None or c.case_id == case_id or c.case_id is None:
                    existing_conv = c
                    break

        now_dt = datetime.now(timezone.utc)
        if not existing_conv:
            existing_conv = ChatConversation(
                case_id=case_id,
                type="direct",
                title=f"{actor.full_name} & {target_user.full_name}",
                created_by_id=actor.id,
                created_at=now_dt,
                updated_at=now_dt,
            )
            self.db.add(existing_conv)
            self.db.flush()

            self.db.add(
                ChatParticipant(
                    conversation_id=existing_conv.id,
                    user_id=actor.id,
                    role_in_case="member",
                    is_active=True,
                    joined_at=now_dt,
                    last_read_at=now_dt,
                )
            )
            self.db.add(
                ChatParticipant(
                    conversation_id=existing_conv.id,
                    user_id=target_user.id,
                    role_in_case="member",
                    is_active=True,
                    joined_at=now_dt,
                    last_read_at=now_dt,
                )
            )
            self.db.commit()
            self.db.refresh(existing_conv)
        else:
            # Reactivate participants if they were inactive
            for p in existing_conv.participants:
                if p.user_id in (actor.id, target_user_id):
                    p.is_active = True
            self.db.commit()

        return self.get_conversation_details(existing_conv.id, actor)

    def mark_as_read(self, conversation_id: UUID, actor: User) -> dict:
        conv, part = self.verify_conversation_access(conversation_id, actor)
        if part:
            part.last_read_at = datetime.now(timezone.utc)
            self.db.commit()
        return {"success": True}
