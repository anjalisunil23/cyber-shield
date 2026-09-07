"""Workflow enhancements: supervisor oversight, case review state, and activity logs.

Revision ID: 007_workflow_enhancements
Revises: 006_phase1_updates
Create Date: 2026-08-19
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "007_workflow_enhancements"
down_revision: Union[str, None] = "006_phase1_updates"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new Enum values inside autocommit block
    with op.get_context().autocommit_block():
        # Case Statuses
        op.execute("ALTER TYPE case_status ADD VALUE IF NOT EXISTS 'in_progress'")
        op.execute("ALTER TYPE case_status ADD VALUE IF NOT EXISTS 'changes_requested'")
        op.execute("ALTER TYPE case_status ADD VALUE IF NOT EXISTS 'approved'")
        op.execute("ALTER TYPE case_status ADD VALUE IF NOT EXISTS 'closed'")

        # Timeline Event Types
        op.execute("ALTER TYPE timeline_event_type ADD VALUE IF NOT EXISTS 'review_submitted'")
        op.execute("ALTER TYPE timeline_event_type ADD VALUE IF NOT EXISTS 'changes_requested'")
        op.execute("ALTER TYPE timeline_event_type ADD VALUE IF NOT EXISTS 'case_approved'")

        # Notification Types
        op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'review_requested'")
        op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'changes_requested'")
        op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'case_approved'")
        op.execute("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'case_reassigned'")

        # Activity Actions
        op.execute("ALTER TYPE activity_action ADD VALUE IF NOT EXISTS 'submit_for_review'")
        op.execute("ALTER TYPE activity_action ADD VALUE IF NOT EXISTS 'request_changes'")
        op.execute("ALTER TYPE activity_action ADD VALUE IF NOT EXISTS 'approve'")
        op.execute("ALTER TYPE activity_action ADD VALUE IF NOT EXISTS 'assign'")

    # Add columns to cases table
    op.add_column(
        "cases",
        sa.Column("supervisor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
    )
    op.add_column("cases", sa.Column("review_comment", sa.Text(), nullable=True))
    op.add_column("cases", sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("cases", sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_cases_supervisor_id", "cases", ["supervisor_id"])

    # Add columns to activity_logs table
    op.add_column(
        "activity_logs",
        sa.Column("case_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cases.id", ondelete="CASCADE"), nullable=True),
    )
    op.add_column("activity_logs", sa.Column("actor_role", sa.String(64), nullable=True))
    op.create_index("ix_activity_logs_case_id", "activity_logs", ["case_id"])


def downgrade() -> None:
    op.drop_index("ix_activity_logs_case_id", table_name="activity_logs")
    op.drop_column("activity_logs", "actor_role")
    op.drop_column("activity_logs", "case_id")

    op.drop_index("ix_cases_supervisor_id", table_name="cases")
    op.drop_column("cases", "reviewed_at")
    op.drop_column("cases", "submitted_at")
    op.drop_column("cases", "review_comment")
    op.drop_column("cases", "supervisor_id")
