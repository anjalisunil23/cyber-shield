"""Add justification and review_comment columns to manual_leads table.

Revision ID: 009_leads_justification_review
Revises: 008_timeline_related_evidence
Create Date: 2026-08-19
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "009_leads_justification_review"
down_revision: Union[str, None] = "008_timeline_related_evidence"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("manual_leads", sa.Column("justification", sa.Text(), nullable=True))
    op.add_column("manual_leads", sa.Column("review_comment", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("manual_leads", "review_comment")
    op.drop_column("manual_leads", "justification")
