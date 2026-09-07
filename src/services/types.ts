/** Shared API domain types for CyberShield Phase 1. */

export type CasePriority = "low" | "medium" | "high" | "critical";
export type CaseStatus =
  | "open"
  | "in_progress"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "closed"
  | "evidence_collection"
  | "analysis"
  | "completed"
  | "archived";

export type EntityKind =
  "evidence" | "person" | "phone" | "email" | "location" | "device" | "organization" | "other";

export type RelationshipType =
  | "evidence_to_evidence"
  | "evidence_to_person"
  | "evidence_to_device"
  | "evidence_to_location"
  | "person_to_person"
  | "person_to_device"
  | "other";

export type LeadStatus = "open" | "in_progress" | "approved" | "rejected" | "closed" | "dismissed";

export type LeadPriority = "low" | "medium" | "high" | "critical";

export type UserBrief = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

export type CaseAssignment = {
  id: string;
  user_id: string;
  is_primary: boolean;
  assigned_at: string;
  user?: UserBrief | null;
};

export type InvestigationCase = {
  id: string;
  case_number: string;
  title: string;
  description: string | null;
  priority: CasePriority;
  status: CaseStatus;
  notes: string | null;
  department_id?: string | null;
  supervisor_id?: string | null;
  review_comment?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  created_by?: UserBrief | null;
  supervisor?: UserBrief | null;
  assignments: CaseAssignment[];
};

export type EvidenceItem = {
  id: string;
  case_id: string;
  filename: string;
  original_name: string;
  file_type: string;
  mime_type: string | null;
  file_size: number;
  sha256_hash: string;
  file_hash?: string;
  warning?: string | null;
  description: string | null;
  tags: string[] | null;
  metadata_json?: Record<string, unknown> | null;
  upload_date: string;
  is_duplicate: boolean;
  duplicate_of_id?: string | null;
  uploaded_by?: UserBrief | null;
  ocr_text?: string | null;
  speech_transcript?: string | null;
  risk_score?: number | null;
  ai_summary?: string | null;
};

export type NoteItem = {
  id: string;
  case_id: string;
  author_id: string;
  title: string | null;
  body: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author?: UserBrief | null;
};

export type TimelineItem = {
  id: string;
  case_id: string;
  event_type: string;
  title: string;
  description: string | null;
  event_at: string;
  related_evidence_id?: string | null;
  created_by?: UserBrief | null;
};

export type RelationshipItem = {
  id: string;
  case_id: string;
  relationship_type: RelationshipType;
  source_kind: EntityKind;
  source_id: string;
  source_label: string;
  target_kind: EntityKind;
  target_id: string;
  target_label: string;
  description: string | null;
  ai_generated: boolean;
};

export type LeadItem = {
  id: string;
  case_id: string;
  title: string;
  description: string | null;
  priority: LeadPriority;
  status: LeadStatus;
  justification?: string | null;
  review_comment?: string | null;
  related_evidence_id?: string | null;
  related_evidence_ids?: string[] | null;
  assigned_to_id?: string | null;
  assigned_to?: UserBrief | null;
  created_by?: UserBrief | null;
  created_at: string;
  updated_at?: string;
};

export type NotificationItem = {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export type ActivityItem = {
  id: string;
  action: string;
  description: string;
  case_id?: string | null;
  actor_role?: string | null;
  created_at: string;
  user?: UserBrief | null;
};

export type ReportItem = {
  id: string;
  case_id: string;
  title: string;
  format: string;
  content: string | null;
  created_at: string;
  summary_json?: Record<string, unknown> | null;
};

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
};

export type DashboardStats = {
  active_cases: number;
  completed_cases: number;
  evidence_uploaded: number;
  investigators: number;
  reports: number;
  monthly_cases: { month: string; count: number }[];
  evidence_types: { type: string; count: number }[];
  priority_distribution: { priority: string; count: number }[];
  recent_activity: ActivityItem[];
  recent_cases: InvestigationCase[];
  latest_uploads: EvidenceItem[];
};

export type AdminUser = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string | null;
  department_id?: string | null;
  phone?: string | null;
  badge_number?: string | null;
  profile_image_url?: string | null;
  is_active: boolean;
  created_at: string;
  last_login?: string | null;
};

export type AdminCase = InvestigationCase & {
  department_id?: string | null;
  evidence_count?: number;
  notes_count?: number;
  timeline_count?: number;
  superior_officer?: UserBrief | null;
  investigators?: UserBrief[];
};

export type AdminDashboardStats = {
  superior_officers: number;
  investigators: number;
  total_cases: number;
  open_cases: number;
  closed_cases: number;
  evidence_count: number;
  monthly_cases: { month: string; count: number }[];
  evidence_types: { type: string; count: number }[];
  priority_distribution: { priority: string; count: number }[];
  recent_activity: ActivityItem[];
  recent_cases: AdminCase[];
  notifications: NotificationItem[];
  storage_bytes: number;
};

export type AdminEvidence = EvidenceItem & {
  case_number?: string | null;
};

export type AdminReportGenerated = {
  id?: string | null;
  title: string;
  report_type: string;
  format: string;
  content: string;
  created_at?: string | null;
  summary?: Record<string, unknown>;
};

export type SearchResult = {
  cases: InvestigationCase[];
  evidence: EvidenceItem[];
  notes: NoteItem[];
  investigators: UserBrief[];
  reports: ReportItem[];
};
