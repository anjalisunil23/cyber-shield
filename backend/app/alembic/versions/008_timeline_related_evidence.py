"""Add related_evidence_id column to timeline table.

Revision ID: 008_timeline_related_evidence
Revises: 007_workflow_enhancements
Create Date: 2026-08-19
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "008_timeline_related_evidence"
down_revision: Union[str, None] = "007_workflow_enhancements"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "timeline",
        sa.Column(
            "related_evidence_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("evidence.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("timeline", "related_evidence_id")
