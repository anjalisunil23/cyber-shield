"""Update entity_kind and lead_status enums and add related_evidence_ids to manual_leads."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "006_phase1_updates"
down_revision: Union[str, None] = "005_normalize_supervisor_role"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE entity_kind ADD VALUE IF NOT EXISTS 'phone'")
        op.execute("ALTER TYPE entity_kind ADD VALUE IF NOT EXISTS 'email'")
        op.execute("ALTER TYPE entity_kind ADD VALUE IF NOT EXISTS 'organization'")
        op.execute("ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'approved'")
        op.execute("ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'rejected'")

    op.add_column(
        "manual_leads",
        sa.Column("related_evidence_ids", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("manual_leads", "related_evidence_ids")
