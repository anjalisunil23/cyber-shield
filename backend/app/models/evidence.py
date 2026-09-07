"""Evidence model with Phase-2 AI placeholder columns (unused in Phase 1)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import BigInteger, Boolean, DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Evidence(Base):
    __tablename__ = "evidence"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True
    )
    filename: Mapped[str] = mapped_column(String(512), nullable=False)
    original_name: Mapped[str] = mapped_column(String(512), nullable=False)
    file_type: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    mime_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    storage_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    sha256_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True, default=list)
    metadata_json: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True, default=dict)
    uploaded_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    upload_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    is_duplicate: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    duplicate_of_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("evidence.id", ondelete="SET NULL"), nullable=True
    )

    @property
    def file_hash(self) -> str:
        return self.sha256_hash

    # ---- Phase 2 AI placeholders (remain empty / null in Phase 1) ----
    ocr_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    speech_transcript: Mapped[str | None] = mapped_column(Text, nullable=True)
    extracted_entities: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    detected_objects: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    detected_faces: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    ai_metadata: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    embeddings: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    risk_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    knowledge_graph_ids: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)

    case = relationship("Case", back_populates="evidence_items")
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])
