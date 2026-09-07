import { apiClient } from "@/services/apiClient";
import type {
  ActivityItem,
  AdminCase,
  AdminDashboardStats,
  AdminEvidence,
  AdminReportGenerated,
  AdminUser,
  CasePriority,
  CaseStatus,
  DashboardStats,
  EvidenceItem,
  InvestigationCase,
  LeadItem,
  NoteItem,
  NotificationItem,
  Page,
  RelationshipItem,
  ReportItem,
  SearchResult,
  TimelineItem,
  UserBrief,
} from "@/services/types";

export const investigationApi = {
  // Cases
  listCases: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<Page<InvestigationCase>>("/api/cases", { params }).then((r) => r.data),

  getCase: (id: string) => apiClient.get<InvestigationCase>(`/api/cases/${id}`).then((r) => r.data),

  createCase: (body: {
    title: string;
    description?: string;
    priority?: CasePriority;
    status?: CaseStatus;
    notes?: string;
    assignee_ids?: string[];
  }) => apiClient.post<InvestigationCase>("/api/cases", body).then((r) => r.data),

  updateCase: (
    id: string,
    body: Partial<{
      title: string;
      description: string;
      priority: CasePriority;
      status: CaseStatus;
      notes: string;
    }>,
  ) => apiClient.patch<InvestigationCase>(`/api/cases/${id}`, body).then((r) => r.data),

  deleteCase: (id: string) => apiClient.delete(`/api/cases/${id}`).then((r) => r.data),

  assignCase: (id: string, user_id: string, is_primary = false) =>
    apiClient
      .post<InvestigationCase>(`/api/cases/${id}/assign`, { user_id, is_primary })
      .then((r) => r.data),

  submitCaseForReview: (caseId: string) =>
    apiClient.post<InvestigationCase>(`/api/cases/${caseId}/submit-review`).then((r) => r.data),

  reviewCase: (
    caseId: string,
    body: { action: "approve" | "request_changes"; review_comment?: string },
  ) => apiClient.post<InvestigationCase>(`/api/cases/${caseId}/review`, body).then((r) => r.data),

  closeCase: (caseId: string) =>
    apiClient.post<InvestigationCase>(`/api/cases/${caseId}/close`).then((r) => r.data),

  // Evidence
  listEvidence: (caseId: string, params?: Record<string, string | number | undefined>) =>
    apiClient
      .get<Page<EvidenceItem>>(`/api/cases/${caseId}/evidence`, { params })
      .then((r) => r.data),

  uploadEvidence: (caseId: string, file: File, description?: string, tags?: string[]) => {
    const form = new FormData();
    form.append("file", file);
    if (description) form.append("description", description);
    if (tags?.length) form.append("tags", JSON.stringify(tags));
    return apiClient
      .post<EvidenceItem>(`/api/cases/${caseId}/evidence`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  getEvidence: (id: string) =>
    apiClient.get<EvidenceItem>(`/api/evidence/${id}`).then((r) => r.data),

  downloadEvidenceUrl: (id: string) => `/api/evidence/${id}/download`,

  deleteEvidence: (id: string) => apiClient.delete(`/api/evidence/${id}`).then((r) => r.data),

  // Notes
  listNotes: (caseId: string) =>
    apiClient.get<NoteItem[]>(`/api/cases/${caseId}/notes`).then((r) => r.data),
  createNote: (caseId: string, body: { title?: string; body: string; is_pinned?: boolean }) =>
    apiClient.post<NoteItem>(`/api/cases/${caseId}/notes`, body).then((r) => r.data),
  updateNote: (id: string, body: Partial<{ title: string; body: string; is_pinned: boolean }>) =>
    apiClient.patch<NoteItem>(`/api/notes/${id}`, body).then((r) => r.data),
  deleteNote: (id: string) => apiClient.delete(`/api/notes/${id}`).then((r) => r.data),

  // Timeline
  listTimeline: (caseId: string) =>
    apiClient.get<TimelineItem[]>(`/api/cases/${caseId}/timeline`).then((r) => r.data),
  createTimeline: (
    caseId: string,
    body: {
      title: string;
      description?: string;
      event_type?: string;
      event_at?: string;
      related_evidence_id?: string;
    },
  ) => apiClient.post<TimelineItem>(`/api/cases/${caseId}/timeline`, body).then((r) => r.data),
  deleteTimeline: (id: string) => apiClient.delete(`/api/timeline/${id}`).then((r) => r.data),

  // Relationships
  listRelationships: (caseId: string) =>
    apiClient.get<RelationshipItem[]>(`/api/cases/${caseId}/relationships`).then((r) => r.data),
  createRelationship: (
    caseId: string,
    body: {
      source_label: string;
      source_kind: string;
      source_id: string;
      target_label: string;
      target_kind: string;
      target_id: string;
      relationship_type?: string;
      description?: string;
    },
  ) =>
    apiClient
      .post<RelationshipItem>(`/api/cases/${caseId}/relationships`, body)
      .then((r) => r.data),
  deleteRelationship: (id: string) =>
    apiClient.delete(`/api/relationships/${id}`).then((r) => r.data),

  // Leads
  listLeads: (caseId: string) =>
    apiClient.get<LeadItem[]>(`/api/cases/${caseId}/leads`).then((r) => r.data),
  createLead: (
    caseId: string,
    body: {
      title: string;
      description?: string;
      priority?: string;
      status?: string;
      justification?: string;
      related_evidence_ids?: string[];
      assigned_to_id?: string;
    },
  ) => apiClient.post<LeadItem>(`/api/cases/${caseId}/leads`, body).then((r) => r.data),
  updateLead: (
    id: string,
    body: {
      status?: string;
      review_comment?: string;
      priority?: string;
      title?: string;
      description?: string;
      justification?: string;
      related_evidence_ids?: string[];
    },
  ) => apiClient.patch<LeadItem>(`/api/leads/${id}`, body).then((r) => r.data),
  deleteLead: (id: string) => apiClient.delete(`/api/leads/${id}`).then((r) => r.data),

  // Reports
  listReports: (caseId: string) =>
    apiClient.get<ReportItem[]>(`/api/cases/${caseId}/reports`).then((r) => r.data),
  createReport: (
    caseId: string,
    body: { title?: string; case_summary?: string; format?: string },
  ) => apiClient.post<ReportItem>(`/api/cases/${caseId}/reports`, body).then((r) => r.data),
  exportReport: (id: string) =>
    apiClient.get<string>(`/api/reports/${id}/export`).then((r) => r.data),

  // Platform
  dashboardStats: () => apiClient.get<DashboardStats>("/api/dashboard/stats").then((r) => r.data),
  search: (q: string) =>
    apiClient.get<SearchResult>("/api/search", { params: { q } }).then((r) => r.data),
  notifications: (unreadOnly = false) =>
    apiClient
      .get<NotificationItem[]>("/api/notifications", { params: { unread_only: unreadOnly } })
      .then((r) => r.data),
  listNotifications: (params?: { unread_only?: boolean }) =>
    apiClient.get<NotificationItem[]>("/api/notifications", { params }).then((r) => r.data),
  unreadCount: () =>
    apiClient.get<{ count: number }>("/api/notifications/unread-count").then((r) => r.data),
  markRead: (id: string) => apiClient.post(`/api/notifications/${id}/read`).then((r) => r.data),
  markNotificationRead: (id: string) =>
    apiClient.post(`/api/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => apiClient.post(`/api/notifications/read-all`).then((r) => r.data),
  activity: (page = 1, caseId?: string) =>
    apiClient
      .get<Page<ActivityItem>>("/api/activity", { params: { page, case_id: caseId } })
      .then((r) => r.data),
  listUsers: (q?: string) =>
    apiClient
      .get<Page<UserBrief & { department?: string | null; is_active?: boolean }>>("/api/users", {
        params: { q },
      })
      .then((r) => r.data),
  createUser: (body: {
    full_name: string;
    email: string;
    password: string;
    confirm_password: string;
    role: string;
    department?: string | null;
  }) => apiClient.post("/api/admin/users", body).then((r) => r.data),
  updateUserAdmin: (id: string, body: Record<string, unknown>) =>
    apiClient.patch(`/api/admin/users/${id}`, body).then((r) => r.data),
  listDepartments: () =>
    apiClient
      .get<
        {
          id: string;
          name: string;
          code: string | null;
          description: string | null;
          is_active: boolean;
        }[]
      >("/api/departments")
      .then((r) => r.data),
  createDepartment: (body: { name: string; code?: string; description?: string }) =>
    apiClient.post("/api/departments", body).then((r) => r.data),
  me: () =>
    apiClient
      .get<{
        id: string;
        full_name: string;
        email: string;
        role: string;
        department: string | null;
        department_id?: string | null;
        is_active: boolean;
      }>("/api/auth/me")
      .then((r) => r.data),
  updateMe: (body: { full_name?: string; department?: string }) =>
    apiClient.patch("/api/auth/me", body).then((r) => r.data),

  // ---- Admin module (department-scoped) ----
  adminDashboard: () =>
    apiClient.get<AdminDashboardStats>("/api/admin/dashboard").then((r) => r.data),

  adminListUsers: (params?: Record<string, string | number | boolean | undefined>) =>
    apiClient.get<Page<AdminUser>>("/api/admin/users", { params }).then((r) => r.data),

  adminGetUser: (id: string) =>
    apiClient.get<AdminUser>(`/api/admin/users/${id}`).then((r) => r.data),

  adminCreateUser: (body: {
    full_name: string;
    email: string;
    phone?: string;
    badge_number?: string;
    role: "superior_officer" | "investigator";
    password: string;
    confirm_password: string;
    is_active?: boolean;
    department?: string;
  }) => apiClient.post<AdminUser>("/api/admin/users", body).then((r) => r.data),

  adminUpdateUser: (id: string, body: Record<string, unknown>) =>
    apiClient.patch<AdminUser>(`/api/admin/users/${id}`, body).then((r) => r.data),

  adminDeleteUser: (id: string) => apiClient.delete(`/api/admin/users/${id}`).then((r) => r.data),

  adminSuspendUser: (id: string) =>
    apiClient.post<AdminUser>(`/api/admin/users/${id}/suspend`).then((r) => r.data),

  adminActivateUser: (id: string) =>
    apiClient.post<AdminUser>(`/api/admin/users/${id}/activate`).then((r) => r.data),

  adminResetPassword: (id: string, new_password: string, confirm_password: string) =>
    apiClient
      .post<AdminUser>(`/api/admin/users/${id}/reset-password`, { new_password, confirm_password })
      .then((r) => r.data),

  adminUploadAvatar: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiClient
      .post<AdminUser>(`/api/admin/users/${id}/avatar`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  adminListCases: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<Page<AdminCase>>("/api/admin/cases", { params }).then((r) => r.data),

  adminGetCase: (id: string) =>
    apiClient.get<AdminCase>(`/api/admin/cases/${id}`).then((r) => r.data),

  adminCreateCase: (body: {
    title: string;
    description?: string;
    priority?: CasePriority;
    status?: CaseStatus;
    notes?: string;
    superior_officer_id?: string;
    investigator_ids?: string[];
  }) => apiClient.post<AdminCase>("/api/admin/cases", body).then((r) => r.data),

  adminUpdateCase: (id: string, body: Record<string, unknown>) =>
    apiClient.patch<AdminCase>(`/api/admin/cases/${id}`, body).then((r) => r.data),

  adminDeleteCase: (id: string) => apiClient.delete(`/api/admin/cases/${id}`).then((r) => r.data),

  adminAssignCase: (
    id: string,
    body: { superior_officer_id?: string; investigator_ids?: string[] },
  ) => apiClient.post<AdminCase>(`/api/admin/cases/${id}/assign`, body).then((r) => r.data),

  adminArchiveCase: (id: string) =>
    apiClient.post<AdminCase>(`/api/admin/cases/${id}/archive`).then((r) => r.data),

  adminListEvidence: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<Page<AdminEvidence>>("/api/admin/evidence", { params }).then((r) => r.data),

  adminDeleteEvidence: (id: string) =>
    apiClient.delete(`/api/admin/evidence/${id}`).then((r) => r.data),

  adminDownloadEvidence: async (id: string, filename?: string) => {
    const res = await apiClient.get(`/api/evidence/${id}/download`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "evidence.bin";
    a.click();
    URL.revokeObjectURL(url);
  },

  adminEvidenceStorage: () =>
    apiClient
      .get<{
        total_files: number;
        total_bytes: number;
        by_type: { type: string; count: number; bytes: number }[];
      }>("/api/admin/evidence/storage")
      .then((r) => r.data),

  adminListReports: (page = 1) =>
    apiClient.get<Page<ReportItem>>("/api/admin/reports", { params: { page } }).then((r) => r.data),

  adminGenerateReport: (body: {
    report_type: "case" | "department" | "investigator" | "evidence";
    case_id?: string;
    investigator_id?: string;
    format?: "csv" | "pdf" | "html";
    title?: string;
  }) =>
    apiClient.post<AdminReportGenerated>("/api/admin/reports/generate", body).then((r) => r.data),

  adminActivity: (page = 1) =>
    apiClient
      .get<Page<ActivityItem>>("/api/admin/activity", { params: { page } })
      .then((r) => r.data),
};
