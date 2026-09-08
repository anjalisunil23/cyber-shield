"""Add investigator_lead_id to cases, role/status to investigator_assignments, and chat tables.

Revision ID: 010_case_hierarchy_and_chat
Revises: 009_leads_justification_review
Create Date: 2026-09-08
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "010_case_hierarchy_and_chat"
down_revision: Union[str, None] = "009_leads_justification_review"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add investigator_lead_id to cases
    op.add_column(
        "cases",
        sa.Column("investigator_lead_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index("ix_cases_investigator_lead_id", "cases", ["investigator_lead_id"])
    op.create_foreign_key(
        "fk_cases_investigator_lead_id",
        "cases",
        "users",
        ["investigator_lead_id"],
        ["id"],
        ondelete="SET NULL",
    )

    # 2. Add role and status to investigator_assignments
    op.add_column(
        "investigator_assignments",
        sa.Column("role", sa.String(length=32), server_default="INVESTIGATOR", nullable=False),
    )
    op.add_column(
        "investigator_assignments",
        sa.Column("status", sa.String(length=32), server_default="active", nullable=False),
    )

    # 3. Backfill investigator_lead_id on existing cases
    op.execute(
        """
        UPDATE cases c
        SET investigator_lead_id = (
            SELECT user_id FROM case_assignments ca 
            WHERE ca.case_id = c.id AND ca.is_primary = true 
            LIMIT 1
        )
        WHERE c.investigator_lead_id IS NULL;
        """
    )
    op.execute(
        """
        UPDATE cases c
        SET investigator_lead_id = (
            SELECT user_id FROM investigator_assignments ia 
            WHERE ia.case_id = c.id 
            ORDER BY ia.assigned_at ASC 
            LIMIT 1
        )
        WHERE c.investigator_lead_id IS NULL;
        """
    )
    op.execute(
        """
        INSERT INTO investigator_assignments (id, case_id, user_id, role, status, assigned_by_id, assigned_at)
        SELECT gen_random_uuid(), c.id, c.investigator_lead_id, 'INVESTIGATOR_LEAD', 'active', c.created_by_id, c.created_at
        FROM cases c
        WHERE c.investigator_lead_id IS NOT NULL
        ON CONFLICT (case_id, user_id) DO UPDATE SET role = 'INVESTIGATOR_LEAD', status = 'active';
        """
    )

    # 4. Create chat_conversations table
    op.create_table(
        "chat_conversations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "case_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("cases.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column("type", sa.String(length=32), nullable=False, server_default="case_group"),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column(
            "created_by_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_chat_conversations_case_id", "chat_conversations", ["case_id"])
    op.create_index("ix_chat_conversations_type", "chat_conversations", ["type"])

    # 5. Create chat_participants table
    op.create_table(
        "chat_participants",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "conversation_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("chat_conversations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("role_in_case", sa.String(length=32), server_default="investigator", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("left_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_read_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("conversation_id", "user_id", name="uq_chat_participant_conv_user"),
    )
    op.create_index("ix_chat_participants_conversation_id", "chat_participants", ["conversation_id"])
    op.create_index("ix_chat_participants_user_id", "chat_participants", ["user_id"])

    # 6. Create chat_messages table
    op.create_table(
        "chat_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "conversation_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("chat_conversations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "sender_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("is_system", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_chat_messages_conversation_id", "chat_messages", ["conversation_id"])
    op.create_index("ix_chat_messages_sender_id", "chat_messages", ["sender_id"])
    op.create_index("ix_chat_messages_created_at", "chat_messages", ["created_at"])


def downgrade() -> None:
    op.drop_table("chat_messages")
    op.drop_table("chat_participants")
    op.drop_table("chat_conversations")
    op.drop_column("investigator_assignments", "status")
    op.drop_column("investigator_assignments", "role")
    op.drop_constraint("fk_cases_investigator_lead_id", "cases", type_="foreignkey")
    op.drop_index("ix_cases_investigator_lead_id", table_name="cases")
    op.drop_column("cases", "investigator_lead_id")
