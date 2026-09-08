"""Shared / case / evidence / note / timeline / relationship / lead schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import (
    CasePriority,
    CaseStatus,
    EntityKind,
    LeadPriority,
    LeadStatus,
    RelationshipType,
    ReportFormat,
    TimelineEventType,
)
from app.models.user import UserRole

T = TypeVar("T")


class PageOut(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    pages: int


class UserBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    full_name: str
    email: EmailStr
    role: UserRole


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    department: str | None = Field(default=None, max_length=255)


class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=10)
    new_password: str = Field(..., min_length=8, max_length=128)


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user_id: str


class AdminUserUpdate(BaseModel):
    full_name: str | None = None
    role: UserRole | None = None
    department: str | None = None
    is_active: bool | None = None


# ---- Cases & Team Hierarchy ----

class CaseCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: str | None = None
    priority: CasePriority = CasePriority.medium
    status: CaseStatus = CaseStatus.open
    notes: str | None = None
    assignee_ids: list[UUID] = Field(default_factory=list)
    investigator_lead_id: UUID | None = None


class CaseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=500)
    description: str | None = None
    priority: CasePriority | None = None
    status: CaseStatus | None = None
    notes: str | None = None


class CaseAssign(BaseModel):
    user_id: UUID
    is_primary: bool = False


class CaseAssignmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    user_id: UUID
    is_primary: bool
    assigned_at: datetime
    user: UserBrief | None = None


class CaseInvestigatorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    case_id: UUID
    user_id: UUID
    role: str
    status: str
    assigned_by_id: UUID | None = None
    assigned_at: datetime
    user: UserBrief | None = None


class AddTeamInvestigatorsRequest(BaseModel):
    investigator_ids: list[UUID] = Field(..., min_length=1)


class ReassignLeadRequest(BaseModel):
    new_lead_id: UUID
    keep_previous_lead: bool = True


class CaseTeamResponse(BaseModel):
    case_id: UUID
    case_number: str
    investigator_lead: CaseInvestigatorOut | None = None
    team_investigators: list[CaseInvestigatorOut] = Field(default_factory=list)
    total_members: int = 0


class CaseReviewRequest(BaseModel):
    action: str = Field(..., pattern="^(approve|request_changes)$")
    review_comment: str | None = None


class CaseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    case_number: str
    title: str
    description: str | None
    priority: CasePriority
    status: CaseStatus
    notes: str | None
    department_id: UUID | None = None
    supervisor_id: UUID | None = None
    investigator_lead_id: UUID | None = None
    review_comment: str | None = None
    submitted_at: datetime | None = None
    reviewed_at: datetime | None = None
    created_by_id: UUID
    created_at: datetime
    updated_at: datetime
    created_by: UserBrief | None = None
    supervisor: UserBrief | None = None
    investigator_lead: UserBrief | None = None
    assignments: list[CaseAssignmentOut] = Field(default_factory=list)
    investigator_assignments: list[CaseInvestigatorOut] = Field(default_factory=list)



# ---- Evidence ----

class EvidenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    case_id: UUID
    filename: str
    original_name: str
    file_type: str
    mime_type: str | None
    file_size: int
    sha256_hash: str
    file_hash: str | None = None
    warning: str | None = None
    description: str | None
    tags: list[Any] | None
    metadata_json: dict[str, Any] | None
    uploaded_by_id: UUID
    upload_date: datetime
    is_duplicate: bool
    duplicate_of_id: UUID | None
    # AI placeholders exposed so clients know the contract
    ocr_text: str | None = None
    speech_transcript: str | None = None
    extracted_entities: dict[str, Any] | None = None
    detected_objects: dict[str, Any] | None = None
    detected_faces: dict[str, Any] | None = None
    ai_metadata: dict[str, Any] | None = None
    embeddings: dict[str, Any] | None = None
    risk_score: float | None = None
    ai_summary: str | None = None
    knowledge_graph_ids: list[Any] | None = None
    uploaded_by: UserBrief | None = None


class EvidenceMetaUpdate(BaseModel):
    description: str | None = None
    tags: list[str] | None = None
    file_hash: str | None = None


# ---- Notes ----

class NoteCreate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    body: str = Field(..., min_length=1)
    is_pinned: bool = False


class NoteUpdate(BaseModel):
    title: str | None = None
    body: str | None = None
    is_pinned: bool | None = None


class NoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    case_id: UUID
    author_id: UUID
    title: str | None
    body: str
    is_pinned: bool
    created_at: datetime
    updated_at: datetime
    author: UserBrief | None = None


# ---- Timeline ----

class TimelineCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: str | None = None
    event_type: TimelineEventType = TimelineEventType.manual
    event_at: datetime | None = None
    related_evidence_id: UUID | None = None


class TimelineOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    case_id: UUID
    event_type: TimelineEventType
    title: str
    description: str | None
    event_at: datetime
    related_evidence_id: UUID | None = None
    created_by_id: UUID | None
    metadata_json: dict[str, Any] | None
    created_at: datetime
    created_by: UserBrief | None = None


# ---- Relationships ----

class RelationshipCreate(BaseModel):
    relationship_type: RelationshipType = RelationshipType.other
    source_kind: EntityKind
    source_id: str = Field(..., min_length=1, max_length=128)
    source_label: str = Field(..., min_length=1, max_length=500)
    target_kind: EntityKind
    target_id: str = Field(..., min_length=1, max_length=128)
    target_label: str = Field(..., min_length=1, max_length=500)
    description: str | None = None


class RelationshipOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    case_id: UUID
    relationship_type: RelationshipType
    source_kind: EntityKind
    source_id: str
    source_label: str
    target_kind: EntityKind
    target_id: str
    target_label: str
    description: str | None
    ai_generated: bool
    confidence: float | None
    created_by_id: UUID | None
    created_at: datetime


# ---- Leads ----

class LeadCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: str | None = None
    priority: LeadPriority = LeadPriority.medium
    status: LeadStatus = LeadStatus.open
    related_evidence_id: UUID | None = None
    related_evidence_ids: list[UUID] = Field(default_factory=list)
    justification: str | None = None
    assigned_to_id: UUID | None = None


class LeadUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: LeadPriority | None = None
    status: LeadStatus | None = None
    related_evidence_id: UUID | None = None
    related_evidence_ids: list[UUID] | None = None
    justification: str | None = None
    review_comment: str | None = None
    assigned_to_id: UUID | None = None


class LeadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    case_id: UUID
    title: str
    description: str | None
    priority: LeadPriority
    status: LeadStatus
    related_evidence_id: UUID | None = None
    related_evidence_ids: list[UUID] | None = None
    justification: str | None = None
    review_comment: str | None = None
    assigned_to_id: UUID | None = None
    created_by_id: UUID
    created_at: datetime
    updated_at: datetime
    assigned_to: UserBrief | None = None
    created_by: UserBrief | None = None


# ---- Notifications / Activity / Reports / Search / Dashboard ----

class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    notification_type: str
    title: str
    message: str
    link: str | None
    is_read: bool
    created_at: datetime


class ActivityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    user_id: UUID | None
    case_id: UUID | None = None
    actor_role: str | None = None
    action: str
    resource_type: str | None
    resource_id: str | None
    description: str
    created_at: datetime
    user: UserBrief | None = None


class ReportCreate(BaseModel):
    title: str | None = None
    case_summary: str | None = None
    format: ReportFormat = ReportFormat.html


class ReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    case_id: UUID
    title: str
    format: ReportFormat
    content: str | None
    storage_path: str | None
    generated_by_id: UUID
    summary_json: dict[str, Any] | None
    created_at: datetime


class SearchResult(BaseModel):
    cases: list[CaseOut] = Field(default_factory=list)
    evidence: list[EvidenceOut] = Field(default_factory=list)
    notes: list[NoteOut] = Field(default_factory=list)
    investigators: list[UserBrief] = Field(default_factory=list)
    reports: list[ReportOut] = Field(default_factory=list)


class DashboardStats(BaseModel):
    active_cases: int
    completed_cases: int
    evidence_uploaded: int
    investigators: int
    reports: int
    monthly_cases: list[dict[str, Any]]
    evidence_types: list[dict[str, Any]]
    priority_distribution: list[dict[str, Any]]
    recent_activity: list[ActivityOut]
    recent_cases: list[CaseOut]
    latest_uploads: list[EvidenceOut]


# ---- Chat & Communication ----

class ChatParticipantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    conversation_id: UUID
    user_id: UUID
    role_in_case: str
    is_active: bool
    joined_at: datetime
    left_at: datetime | None = None
    last_read_at: datetime
    user: UserBrief | None = None


class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)


class ChatMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    conversation_id: UUID
    sender_id: UUID | None = None
    content: str
    is_system: bool
    created_at: datetime
    sender: UserBrief | None = None


class ChatConversationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    case_id: UUID | None = None
    type: str
    title: str
    created_by_id: UUID | None = None
    created_at: datetime
    updated_at: datetime
    case_number: str | None = None
    participants: list[ChatParticipantOut] = Field(default_factory=list)
    last_message: ChatMessageOut | None = None
    unread_count: int = 0


class DirectChatCreate(BaseModel):
    target_user_id: UUID
    case_id: UUID | None = None

