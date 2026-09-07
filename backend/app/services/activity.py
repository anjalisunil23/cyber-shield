"""Activity logging helper."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.audit import ActivityLog
from app.models.enums import ActivityAction


def log_activity(
    db: Session,
    *,
    user_id: UUID | None,
    action: ActivityAction,
    description: str,
    case_id: UUID | None = None,
    actor_role: str | None = None,
    resource_type: str | None = None,
    resource_id: str | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> ActivityLog:
    entry = ActivityLog(
        user_id=user_id,
        case_id=case_id,
        actor_role=actor_role,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        description=description,
        ip_address=ip_address,
        user_agent=user_agent,
        metadata_json=metadata,
    )
    db.add(entry)
    return entry
