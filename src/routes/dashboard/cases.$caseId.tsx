import { createFileRoute, Link, useMatch } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  FileText,
  Filter,
  AlertTriangle,
  Pin,
  Trash2,
  Upload,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Archive,
  MessageSquare,
  Users,
  UserCheck,
  UserPlus,
  MoreVertical,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Badge,
  formatLabel,
  priorityBadgeClass,
  statusBadgeClass,
} from "@/components/dashboard/Badge";
import { getToken } from "@/lib/auth";
import { apiMessage } from "@/services/apiClient";
import { investigationApi } from "@/services/investigationApi";
import { ChatInterface } from "@/components/chat/ChatInterface";
import type {
  EntityKind,
  LeadPriority,
  LeadStatus,
  RelationshipType,
  CasePriority,
  CaseStatus,
  EvidenceItem,
  InvestigationCase,
  ActivityItem,
  RelationshipItem,
  LeadItem,
  TimelineItem,
  ReportItem,
  NoteItem,
  CaseTeamResponse,
  CaseInvestigator,
  AdminUser,
} from "@/services/types";
import { getStoredCases, useEvidenceList } from "@/data/mock/platformState";
import { MOCK_USERS } from "@/data/mock/platform";

export const Route = createFileRoute("/dashboard/cases/$caseId")({
  component: CaseDetailPage,
});

type Tab =
  | "overview"
  | "evidence"
  | "notes"
  | "timeline"
  | "relationships"
  | "leads"
  | "reports"
  | "activity";

const isUUID = (str?: string) =>
  !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export function CaseDetailPage() {
  const match = useMatch({ strict: false });
  const params = (match.params as Record<string, string>) || {};

  let caseIdParam = params.caseId || "";
  if (!caseIdParam && typeof window !== "undefined") {
    const parts = window.location.pathname.split("/").filter(Boolean);
    caseIdParam = decodeURIComponent(parts[parts.length - 1] || "");
  }

  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [timelineEvidenceFilter, setTimelineEvidenceFilter] = useState<string>("all");

  const [showRequestChangesModal, setShowRequestChangesModal] = useState(false);
  const [requestChangesComment, setRequestChangesComment] = useState("");
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveComment, setApproveComment] = useState("");

  // Case Investigation Team & Chat State
  const [localLead, setLocalLead] = useState<CaseInvestigator | null>(null);
  const [localTeamMembers, setLocalTeamMembers] = useState<CaseInvestigator[]>([]);
  const [showAddInvestigatorModal, setShowAddInvestigatorModal] = useState(false);
  const [addInvestigatorSearch, setAddInvestigatorSearch] = useState("");
  const [selectedInvIds, setSelectedInvIds] = useState<string[]>([]);

  const [showReassignLeadModal, setShowReassignLeadModal] = useState(false);
  const [selectedNewLeadId, setSelectedNewLeadId] = useState("");
  const [keepPrevLead, setKeepPrevLead] = useState(true);

  const [showChatModal, setShowChatModal] = useState(false);
  const [activeDirectChatUserId, setActiveDirectChatUserId] = useState<string | undefined>(undefined);

  const meQ = useQuery({ queryKey: ["me"], queryFn: () => investigationApi.me() });
  const userRole = meQ.data?.role || "";
  const isSupervisor = ["supervisor", "superior_officer", "major_admin", "admin"].includes(
    userRole,
  );
  const isInvestigator = userRole === "investigator" || !isSupervisor;

  const caseQ = useQuery({
    queryKey: ["case-resolved", caseIdParam],
    queryFn: async (): Promise<InvestigationCase> => {
      if (!caseIdParam) {
        return {
          id: "cs-fallback",
          case_number: "CS-2026-0000",
          title: "Investigation Case",
          description: "Digital evidence and case overview.",
          priority: "medium",
          status: "open",
          notes: null,
          created_by_id: "00000000-0000-0000-0000-000000000000",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          assignments: [],
        } as InvestigationCase;
      }

      // 1. If valid UUID, try direct getCase API
      if (isUUID(caseIdParam)) {
        try {
          const c = await investigationApi.getCase(caseIdParam);
          if (c) return c;
        } catch (e) {
          console.warn("getCase by UUID failed, trying list search:", e);
        }
      }

      // 2. Search backend API cases by query or list (match id or case_number)
      try {
        const page = await investigationApi.listCases({ page_size: 100 });
        if (page?.items) {
          const found = page.items.find(
            (item) =>
              item.id === caseIdParam ||
              item.case_number.toLowerCase() === caseIdParam.toLowerCase() ||
              item.case_number.replace(/-/g, "").toLowerCase() ===
                caseIdParam.replace(/-/g, "").toLowerCase() ||
              item.title.toLowerCase().includes(caseIdParam.toLowerCase()),
          );
          if (found) return found;
        }
      } catch (e) {
        console.warn("listCases failed:", e);
      }

      // 3. Fallback to stored local cases (mock or offline created cases)
      const stored = getStoredCases();
      const mockFound = stored.find(
        (item) =>
          item.id === caseIdParam ||
          item.caseNumber.toLowerCase() === caseIdParam.toLowerCase() ||
          item.caseNumber.replace(/-/g, "").toLowerCase() ===
            caseIdParam.replace(/-/g, "").toLowerCase() ||
          item.title.toLowerCase().includes(caseIdParam.toLowerCase()),
      );
      if (mockFound) {
        return {
          id: mockFound.id,
          case_number: mockFound.caseNumber,
          title: mockFound.title,
          description:
            mockFound.description || "Digital investigation case details and associated evidence.",
          priority: (mockFound.priority.toLowerCase() as CasePriority) || "medium",
          status: (mockFound.status.toLowerCase().replace(/ /g, "_") as CaseStatus) || "open",
          notes: null,
          created_by_id: "00000000-0000-0000-0000-000000000000",
          created_at: mockFound.created || new Date().toISOString(),
          updated_at: mockFound.updated || new Date().toISOString(),
          assignments:
            mockFound.assignee && mockFound.assignee !== "Unassigned"
              ? [
                  {
                    id: "a1",
                    user_id: "u1",
                    is_primary: true,
                    assigned_at: mockFound.created || new Date().toISOString(),
                    user: {
                      id: "u1",
                      full_name: mockFound.assignee,
                      email: "agent@shield.gov",
                      role: "investigator",
                    },
                  },
                ]
              : [],
        } as InvestigationCase;
      }

      // 4. Default safe fallback object if case ID not found anywhere so page NEVER crashes
      const cleanCaseNo = caseIdParam.startsWith("CS-")
        ? caseIdParam
        : `CS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        id: caseIdParam,
        case_number: cleanCaseNo,
        title: caseIdParam.startsWith("CS-") ? `Case ${caseIdParam}` : caseIdParam,
        description: "Case investigation file and digital evidence collection.",
        priority: "medium",
        status: "open",
        notes: null,
        created_by_id: "00000000-0000-0000-0000-000000000000",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assignments: [],
      } as InvestigationCase;
    },
    retry: false,
  });

  const c = caseQ.data;
  const resolvedCaseId = c?.id || caseIdParam;
  const resolvedCaseNumber = c?.case_number || caseIdParam;
  const validUUID = isUUID(resolvedCaseId);

  const evidenceQ = useQuery({
    queryKey: ["evidence", resolvedCaseId],
    queryFn: async () => {
      if (!validUUID) return { items: [], total: 0, page: 1, page_size: 50, pages: 1 };
      try {
        return await investigationApi.listEvidence(resolvedCaseId);
      } catch {
        return { items: [], total: 0, page: 1, page_size: 50, pages: 1 };
      }
    },
    enabled: !!resolvedCaseId,
    retry: false,
  });
  const notesQ = useQuery({
    queryKey: ["notes", resolvedCaseId],
    queryFn: async () => {
      if (!validUUID) return [];
      try {
        return await investigationApi.listNotes(resolvedCaseId);
      } catch {
        return [];
      }
    },
    enabled: (tab === "notes" || tab === "overview") && validUUID,
    retry: false,
  });
  const timelineQ = useQuery({
    queryKey: ["timeline", resolvedCaseId],
    queryFn: async () => {
      if (!validUUID) return [];
      try {
        return await investigationApi.listTimeline(resolvedCaseId);
      } catch {
        return [];
      }
    },
    enabled: (tab === "timeline" || tab === "overview" || tab === "activity") && validUUID,
    retry: false,
  });
  const relQ = useQuery({
    queryKey: ["relationships", resolvedCaseId],
    queryFn: async () => {
      if (!validUUID) return [];
      try {
        return await investigationApi.listRelationships(resolvedCaseId);
      } catch {
        return [];
      }
    },
    enabled: tab === "relationships" && validUUID,
    retry: false,
  });
  const leadsQ = useQuery({
    queryKey: ["leads", resolvedCaseId],
    queryFn: async () => {
      if (!validUUID) return [];
      try {
        return await investigationApi.listLeads(resolvedCaseId);
      } catch {
        return [];
      }
    },
    enabled: tab === "leads" && validUUID,
    retry: false,
  });
  const reportsQ = useQuery({
    queryKey: ["reports", resolvedCaseId],
    queryFn: async () => {
      if (!validUUID) return [];
      try {
        return await investigationApi.listReports(resolvedCaseId);
      } catch {
        return [];
      }
    },
    enabled: tab === "reports" && validUUID,
    retry: false,
  });
  const activityQ = useQuery({
    queryKey: ["activity", resolvedCaseId],
    queryFn: async () => {
      if (!validUUID) return { items: [], total: 0, page: 1, page_size: 50, pages: 1 };
      try {
        return await investigationApi.activity(1, resolvedCaseId);
      } catch {
        return { items: [], total: 0, page: 1, page_size: 50, pages: 1 };
      }
    },
    enabled: (tab === "activity" || tab === "overview") && validUUID,
    retry: false,
  });

  const teamQ = useQuery({
    queryKey: ["case-team", resolvedCaseId],
    queryFn: async () => {
      if (!validUUID) return null;
      try {
        return await investigationApi.getCaseTeam(resolvedCaseId);
      } catch {
        return null;
      }
    },
    enabled: validUUID,
    retry: false,
  });

  const usersQ = useQuery({
    queryKey: ["users-page-all"],
    queryFn: async () => {
      try {
        const page = await investigationApi.listUsers();
        return page.items || [];
      } catch {
        return [];
      }
    },
    enabled: true,
    retry: false,
  });

  const allUsersList: AdminUser[] = (() => {
    const list: AdminUser[] = [...(usersQ.data || [])];
    MOCK_USERS.forEach((mu) => {
      if (!list.some((u) => u.id === mu.id || u.email.toLowerCase() === mu.email.toLowerCase())) {
        list.push({
          id: mu.id,
          email: mu.email,
          full_name: mu.name,
          role: mu.role.toLowerCase(),
          is_active: mu.status === "Active",
          created_at: new Date().toISOString(),
        } as AdminUser);
      }
    });
    return list;
  })();

  const addTeamMutation = useMutation({
    mutationFn: async (investigator_ids: string[]) => {
      if (validUUID) {
        try {
          return await investigationApi.addTeamInvestigators(resolvedCaseId, { investigator_ids });
        } catch (e) {
          console.warn("API addTeamInvestigators error, using local state update:", e);
        }
      }
      return null;
    },
    onSuccess: (_, investigator_ids) => {
      const addedMembers: CaseInvestigator[] = [];
      investigator_ids.forEach((id) => {
        const u = allUsersList.find((x) => x.id === id);
        if (u) {
          addedMembers.push({
            id: `team-local-${id}`,
            case_id: resolvedCaseId,
            user_id: u.id,
            role: "INVESTIGATOR",
            status: "active",
            assigned_at: new Date().toISOString(),
            user: {
              id: u.id,
              full_name: u.full_name,
              email: u.email,
              role: u.role,
            },
          });
        }
      });
      setLocalTeamMembers((prev) => [...prev, ...addedMembers]);
      toast.success(`${investigator_ids.length} investigator(s) assigned to case team`);
      setShowAddInvestigatorModal(false);
      setSelectedInvIds([]);
      void qc.invalidateQueries({ queryKey: ["case-team", resolvedCaseId] });
      void qc.invalidateQueries({ queryKey: ["case-resolved", caseIdParam] });
      void qc.invalidateQueries({ queryKey: ["timeline", resolvedCaseId] });
      void qc.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  const removeTeamMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (validUUID) {
        try {
          return await investigationApi.removeTeamInvestigator(resolvedCaseId, userId);
        } catch (e) {
          console.warn("API removeTeamInvestigator error, using local state update:", e);
        }
      }
      return null;
    },
    onSuccess: (_, userId) => {
      setLocalTeamMembers((prev) => prev.filter((m) => m.user_id !== userId));
      toast.success("Investigator removed from case team");
      void qc.invalidateQueries({ queryKey: ["case-team", resolvedCaseId] });
      void qc.invalidateQueries({ queryKey: ["case-resolved", caseIdParam] });
      void qc.invalidateQueries({ queryKey: ["timeline", resolvedCaseId] });
      void qc.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  const reassignLeadMutation = useMutation({
    mutationFn: async (payload: { new_investigator_lead_id: string; keep_previous_as_investigator: boolean }) => {
      if (validUUID) {
        try {
          return await investigationApi.reassignCaseLead(resolvedCaseId, payload);
        } catch (e) {
          console.warn("API reassignCaseLead error, using local state update:", e);
        }
      }
      return null;
    },
    onSuccess: (_, vars) => {
      const newLeadUser = allUsersList.find((u) => u.id === vars.new_investigator_lead_id);
      if (newLeadUser) {
        setLocalLead({
          id: `lead-local-${newLeadUser.id}`,
          case_id: resolvedCaseId,
          user_id: newLeadUser.id,
          role: "INVESTIGATOR_LEAD",
          status: "active",
          assigned_at: new Date().toISOString(),
          user: {
            id: newLeadUser.id,
            full_name: newLeadUser.full_name,
            email: newLeadUser.email,
            role: newLeadUser.role,
          },
        });
      }
      toast.success("Investigator Lead established successfully");
      setShowReassignLeadModal(false);
      setSelectedNewLeadId("");
      void qc.invalidateQueries({ queryKey: ["case-team", resolvedCaseId] });
      void qc.invalidateQueries({ queryKey: ["case-resolved", caseIdParam] });
      void qc.invalidateQueries({ queryKey: ["timeline", resolvedCaseId] });
      void qc.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  const updateCase = useMutation({
    mutationFn: (body: { status?: CaseStatus; priority?: CasePriority; notes?: string }) =>
      investigationApi.updateCase(resolvedCaseId, body),
    onSuccess: () => {
      toast.success("Case updated");
      void qc.invalidateQueries({ queryKey: ["case-resolved", caseIdParam] });
      void qc.invalidateQueries({ queryKey: ["timeline", resolvedCaseId] });
      void qc.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  const submitForReview = useMutation({
    mutationFn: () => investigationApi.submitCaseForReview(resolvedCaseId),
    onSuccess: () => {
      toast.success("Case submitted for supervisor review!");
      void qc.invalidateQueries({ queryKey: ["case-resolved", caseIdParam] });
      void qc.invalidateQueries({ queryKey: ["timeline", resolvedCaseId] });
      void qc.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  const reviewCase = useMutation({
    mutationFn: (body: { action: "approve" | "request_changes"; review_comment?: string }) =>
      investigationApi.reviewCase(resolvedCaseId, body),
    onSuccess: (_, vars) => {
      if (vars.action === "approve") {
        toast.success("Case approved successfully!");
        setShowApproveModal(false);
        setApproveComment("");
      } else {
        toast.warning("Changes requested from investigators");
        setShowRequestChangesModal(false);
        setRequestChangesComment("");
      }
      void qc.invalidateQueries({ queryKey: ["case-resolved", caseIdParam] });
      void qc.invalidateQueries({ queryKey: ["timeline", resolvedCaseId] });
      void qc.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  const closeCase = useMutation({
    mutationFn: () => investigationApi.closeCase(resolvedCaseId),
    onSuccess: () => {
      toast.success("Case closed and archived");
      void qc.invalidateQueries({ queryKey: ["case-resolved", caseIdParam] });
      void qc.invalidateQueries({ queryKey: ["timeline", resolvedCaseId] });
      void qc.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  const upload = useMutation({
    mutationFn: (data: { file: File; description?: string; tags?: string[] }) =>
      investigationApi.uploadEvidence(resolvedCaseId, data.file, data.description, data.tags),
    onSuccess: (res) => {
      toast.success("Evidence uploaded");
      if (res.is_duplicate || res.warning) {
        toast.warning(res.warning || "Duplicate file detected!", { duration: 6000 });
      }
      void qc.invalidateQueries({ queryKey: ["evidence", resolvedCaseId] });
      void qc.invalidateQueries({ queryKey: ["case-resolved", caseIdParam] });
      void qc.invalidateQueries({ queryKey: ["timeline", resolvedCaseId] });
      void qc.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  const addNote = useMutation({
    mutationFn: (body: string) => investigationApi.createNote(resolvedCaseId, { body }),
    onSuccess: () => {
      toast.success("Note added");
      void qc.invalidateQueries({ queryKey: ["notes", resolvedCaseId] });
      void qc.invalidateQueries({ queryKey: ["case-resolved", caseIdParam] });
      void qc.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  const addTimeline = useMutation({
    mutationFn: (payload: {
      title: string;
      description?: string;
      event_type?: string;
      event_at?: string;
      related_evidence_id?: string;
    }) => investigationApi.createTimeline(resolvedCaseId, payload),
    onSuccess: () => {
      toast.success("Timeline event added");
      void qc.invalidateQueries({ queryKey: ["timeline", resolvedCaseId] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  const addRel = useMutation({
    mutationFn: (payload: {
      source_label: string;
      source_kind: EntityKind;
      source_id: string;
      target_label: string;
      target_kind: EntityKind;
      target_id: string;
      relationship_type: RelationshipType;
      description?: string;
    }) => investigationApi.createRelationship(resolvedCaseId, payload),
    onSuccess: () => {
      toast.success("Relationship created");
      void qc.invalidateQueries({ queryKey: ["relationships", resolvedCaseId] });
      void qc.invalidateQueries({ queryKey: ["timeline", resolvedCaseId] });
      void qc.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  const addLead = useMutation({
    mutationFn: (payload: {
      title: string;
      description?: string;
      priority: LeadPriority;
      justification?: string;
      related_evidence_ids?: string[];
    }) => investigationApi.createLead(resolvedCaseId, payload),
    onSuccess: () => {
      toast.success("Lead created");
      void qc.invalidateQueries({ queryKey: ["leads", resolvedCaseId] });
      void qc.invalidateQueries({ queryKey: ["timeline", resolvedCaseId] });
      void qc.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  const updateLeadStatus = useMutation({
    mutationFn: ({
      id,
      status,
      review_comment,
    }: {
      id: string;
      status: LeadStatus;
      review_comment?: string;
    }) => investigationApi.updateLead(id, { status, review_comment }),
    onSuccess: () => {
      toast.success("Lead updated");
      void qc.invalidateQueries({ queryKey: ["leads", resolvedCaseId] });
      void qc.invalidateQueries({ queryKey: ["timeline", resolvedCaseId] });
      void qc.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  const genReport = useMutation({
    mutationFn: (payload: { title?: string; case_summary?: string; format: string }) =>
      investigationApi.createReport(resolvedCaseId, payload),
    onSuccess: () => {
      toast.success("Draft Report generated");
      void qc.invalidateQueries({ queryKey: ["reports", resolvedCaseId] });
      void qc.invalidateQueries({ queryKey: ["timeline", resolvedCaseId] });
      void qc.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  const storedEvidenceItems = useEvidenceList();

  const tabs: Tab[] = [
    "overview",
    "evidence",
    "notes",
    "timeline",
    "relationships",
    "leads",
    "reports",
    "activity",
  ];
  const tabLabels: Record<Tab, string> = {
    overview: "Overview",
    evidence: "Evidence Vault",
    notes: "Notes",
    timeline: "Timeline",
    relationships: "Relationships Graph",
    leads: "Leads",
    reports: "Reports",
    activity: "Audit Activity History",
  };

  if (caseQ.isLoading) return <p className="text-sm text-slate-400">Loading case details…</p>;
  if (!c) return <p className="text-sm text-red-400">Case not found</p>;

  // Merge API evidence items with local stored evidence matching this case
  const apiEvidence = evidenceQ.data?.items || [];
  const storedEv = storedEvidenceItems.filter(
    (e) =>
      e.caseNumber === resolvedCaseNumber ||
      e.caseNumber === caseIdParam ||
      e.id === resolvedCaseId,
  );
  const mergedEv = [...apiEvidence];
  for (const lev of storedEv) {
    if (!mergedEv.some((m) => m.id === lev.id || m.original_name === lev.name)) {
      mergedEv.push({
        id: lev.id,
        case_id: resolvedCaseId,
        filename: lev.name,
        original_name: lev.name,
        file_type:
          lev.type === "pdf"
            ? "pdf"
            : ["image", "video", "audio", "document"].includes(lev.type)
              ? lev.type
              : "other",
        mime_type: null,
        file_size: 102400,
        sha256_hash: lev.sha256,
        description: null,
        tags: lev.tags || [],
        upload_date: lev.uploadedAt || new Date().toISOString(),
        is_duplicate: false,
        uploaded_by_id: "00000000-0000-0000-0000-000000000000",
      } as EvidenceItem);
    }
  }
  const evidenceList = mergedEv;

  const canSubmitForReview = ["open", "in_progress", "changes_requested"].includes(c.status);

  const currentUserId = meQ.data?.id;
  const teamData = teamQ.data;
  const rawLead =
    localLead ||
    teamData?.investigator_lead ||
    (c?.investigator_lead
      ? ({
          id: "lead-assign",
          case_id: resolvedCaseId,
          user_id: c.investigator_lead.id,
          role: "INVESTIGATOR_LEAD",
          status: "active",
          assigned_at: c.created_at,
          user: c.investigator_lead,
        } as CaseInvestigator)
      : null);

  // If not found in investigator_lead, check assignments for an actual INVESTIGATOR (never supervisor/admin)
  const candidateFromAssignments =
    !rawLead && c?.assignments?.length
      ? c.assignments.find((a) => {
          const role = (a.user?.role || "").toLowerCase();
          const isNotSupervisor = !["supervisor", "superior_officer", "major_admin", "admin"].includes(
            role,
          );
          const isNotSupervisorId =
            a.user_id !== c.supervisor_id && a.user_id !== c.created_by_id;
          return isNotSupervisor && isNotSupervisorId;
        })
      : null;

  const leadInvestigator: CaseInvestigator | undefined = rawLead
    ? ["supervisor", "superior_officer", "major_admin", "admin"].includes(
        (rawLead.user?.role || "").toLowerCase(),
      )
      ? undefined
      : rawLead
    : candidateFromAssignments
      ? ({
          id: candidateFromAssignments.id || "lead-assign-primary",
          case_id: resolvedCaseId,
          user_id: candidateFromAssignments.user_id,
          role: "INVESTIGATOR_LEAD",
          status: "active",
          assigned_at: candidateFromAssignments.assigned_at || c?.created_at,
          user: candidateFromAssignments.user,
        } as CaseInvestigator)
      : undefined;

  // Merge team data from backend, local state, and non-lead investigator assignments
  const baseTeam = teamData?.team_investigators || [];
  const assignedTeam = (c?.assignments || [])
    .filter((a) => {
      const role = (a.user?.role || "").toLowerCase();
      const isInvestigatorRole = ![
        "supervisor",
        "superior_officer",
        "major_admin",
        "admin",
      ].includes(role);
      return isInvestigatorRole && a.user_id !== leadInvestigator?.user_id;
    })
    .map(
      (a) =>
        ({
          id: a.id,
          case_id: resolvedCaseId,
          user_id: a.user_id,
          role: "INVESTIGATOR",
          status: "active",
          assigned_at: a.assigned_at,
          user: a.user,
        }) as CaseInvestigator,
    );

  const mergedTeamMap = new Map<string, CaseInvestigator>();
  baseTeam.forEach((inv) => mergedTeamMap.set(inv.user_id, inv));
  assignedTeam.forEach((inv) => {
    if (!mergedTeamMap.has(inv.user_id)) mergedTeamMap.set(inv.user_id, inv);
  });
  localTeamMembers.forEach((inv) => {
    if (inv.user_id !== leadInvestigator?.user_id) {
      mergedTeamMap.set(inv.user_id, inv);
    }
  });

  const teamInvestigators = Array.from(mergedTeamMap.values()).filter(
    (inv) =>
      inv.user_id !== leadInvestigator?.user_id &&
      !["supervisor", "superior_officer", "major_admin", "admin"].includes(
        (inv.user?.role || "").toLowerCase(),
      ),
  );

  const leadUserId = leadInvestigator?.user_id || c?.investigator_lead_id;
  const isCaseLead = Boolean(currentUserId && leadUserId && currentUserId === leadUserId);
  const canManageTeam = isCaseLead || isSupervisor;
  const canReassignLead = isSupervisor;

  const assignedUserIds = new Set<string>();
  if (leadInvestigator?.user_id) assignedUserIds.add(leadInvestigator.user_id);
  teamInvestigators.forEach((inv) => assignedUserIds.add(inv.user_id));

  const availableInvestigators = allUsersList.filter((u) => {
    const isInv = (u.role || "").toLowerCase().includes("investigator");
    const isNotAssigned = !assignedUserIds.has(u.id);
    const searchMatch =
      addInvestigatorSearch.trim() === "" ||
      u.full_name.toLowerCase().includes(addInvestigatorSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(addInvestigatorSearch.toLowerCase());
    return isInv && isNotAssigned && searchMatch;
  });

  const eligibleLeadInvestigators = allUsersList.filter((u) => {
    const isInv = (u.role || "").toLowerCase().includes("investigator");
    return isInv && u.id !== leadUserId;
  });

  const totalTeamCount = (leadInvestigator ? 1 : 0) + teamInvestigators.length;

  return (
    <div className="space-y-5">
      {/* Header & Role Action Bar */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="space-y-1">
          <Link
            to="/dashboard/cases"
            className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium"
          >
            ← Back to cases list
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{c.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="font-mono text-primary font-semibold">{c.case_number}</span>
            <span>·</span>
            <span>Created by: {c.created_by?.full_name || "Investigator"}</span>
            {c.supervisor && (
              <>
                <span>·</span>
                <span className="text-muted-foreground">
                  Supervisor: <strong className="text-primary">{c.supervisor.full_name}</strong>
                </span>
              </>
            )}
            <span>·</span>
            <span>Updated: {new Date(c.updated_at).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Badge className={priorityBadgeClass(c.priority)}>{formatLabel(c.priority)}</Badge>
          <Badge className={statusBadgeClass(c.status)}>{formatLabel(c.status)}</Badge>

          {/* Investigator Action: Submit For Review */}
          {isInvestigator && canSubmitForReview && (
            <button
              type="button"
              disabled={submitForReview.isPending}
              onClick={() => submitForReview.mutate()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {submitForReview.isPending ? "Submitting..." : "Submit for Supervisor Review"}
            </button>
          )}

          {/* Supervisor Actions — only while under review */}
          {isSupervisor && c.status === "under_review" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRequestChangesModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/20 px-3.5 py-2 text-xs font-bold text-amber-600 dark:text-amber-300 hover:bg-amber-500/30 transition-colors"
              >
                <AlertTriangle className="h-3.5 w-3.5" /> Request Changes
              </button>
              <button
                type="button"
                onClick={() => setShowApproveModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 dark:bg-emerald-500 px-4 py-2 text-xs font-bold text-white dark:text-slate-950 hover:bg-emerald-500 transition-colors shadow-md"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve Case
              </button>
            </div>
          )}

          {isSupervisor && c.status === "approved" && (
            <button
              type="button"
              disabled={closeCase.isPending}
              onClick={() => closeCase.mutate()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-muted px-4 py-2 text-xs font-bold text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50 border border-border"
            >
              <Archive className="h-3.5 w-3.5" />
              {closeCase.isPending ? "Closing..." : "Close Case"}
            </button>
          )}
        </div>
      </div>

      {/* Visual Workflow Progress Pipeline */}
      <CaseWorkflowProgressBar status={c.status} />

      {/* Workflow Status Banners */}
      {c.status === "changes_requested" && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 sm:p-5 text-amber-100 flex flex-col sm:flex-row items-start justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
              <span>Supervisor Feedback: Changes Requested Before Approval</span>
            </div>
            <p className="text-xs text-amber-200/90 whitespace-pre-wrap pl-7">
              {c.review_comment
                ? `"${c.review_comment}"`
                : "Please review evidence, update findings, and resubmit."}
            </p>
            <p className="text-[11px] text-amber-400/80 pl-7">
              Reviewed by {c.supervisor?.full_name || "Supervisor"} ·{" "}
              {c.reviewed_at ? new Date(c.reviewed_at).toLocaleString() : "Recently"}
            </p>
          </div>
          {isInvestigator && (
            <button
              type="button"
              disabled={submitForReview.isPending}
              onClick={() => submitForReview.mutate()}
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {submitForReview.isPending ? "Resubmitting..." : "Resubmit for Review"}
            </button>
          )}
        </div>
      )}

      {c.status === "approved" && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-100 flex items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-300">Case Investigation Approved</p>
              <p className="text-xs text-emerald-200/80">
                Authorized by {c.supervisor?.full_name || "Supervisor"} on{" "}
                {c.reviewed_at ? new Date(c.reviewed_at).toLocaleString() : "Recently"}
                {c.review_comment ? ` — Note: ${c.review_comment}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-lg bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30 uppercase">
              Approved
            </span>
            {isSupervisor && (
              <button
                type="button"
                disabled={closeCase.isPending}
                onClick={() => closeCase.mutate()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors disabled:opacity-50"
              >
                <Archive className="h-3.5 w-3.5" />
                {closeCase.isPending ? "Closing..." : "Close Case"}
              </button>
            )}
          </div>
        </div>
      )}

      {c.status === "closed" && (
        <div className="rounded-2xl border border-slate-500/40 bg-slate-500/10 p-4 text-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Archive className="h-5 w-5 text-slate-300 shrink-0" />
            <div>
              <p className="text-sm font-bold text-slate-100">Case Closed</p>
              <p className="text-xs text-slate-400">
                This investigation is archived and concluded.
              </p>
            </div>
          </div>
        </div>
      )}

      {c.status === "under_review" && (
        <div className="rounded-2xl border border-cyan/40 bg-cyan/10 p-4 text-cyan-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-cyan shrink-0" />
            <div>
              <p className="text-sm font-bold text-cyan">Awaiting Supervisor Review</p>
              <p className="text-xs text-cyan-200/80">
                Submitted on{" "}
                {c.submitted_at ? new Date(c.submitted_at).toLocaleString() : "Recently"}. Awaiting
                superior officer sign-off or change requests.
              </p>
            </div>
          </div>
          {isSupervisor && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRequestChangesModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition-colors"
              >
                <AlertTriangle className="h-3.5 w-3.5" /> Request Changes
              </button>
              <button
                type="button"
                onClick={() => setShowApproveModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve Case
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-1 border-b border-border pb-2">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t
                ? "bg-primary/20 text-primary border border-primary/30 font-semibold"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground">Case Details</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {c.description || "No description provided."}
              </p>

              {c.review_comment && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">
                    Supervisor Review Comment
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{c.review_comment}</p>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-border">
                <div className="block text-xs text-muted-foreground">
                  Status
                  <p className="mt-1">
                    <Badge className={statusBadgeClass(c.status)}>{formatLabel(c.status)}</Badge>
                  </p>
                  <p className="mt-1.5 text-[11px] text-muted-foreground/80">
                    Workflow status is changed by review actions, not this panel.
                  </p>
                </div>
                <label className="block text-xs text-muted-foreground">
                  Priority
                  <select
                    value={c.priority}
                    onChange={(e) => updateCase.mutate({ priority: e.target.value as CasePriority })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    {(["low", "medium", "high", "critical"] as CasePriority[]).map((p) => (
                      <option key={p} value={p}>
                        {formatLabel(p)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-foreground">Recent Activity Timeline</h3>
                <button
                  type="button"
                  onClick={() => setTab("timeline")}
                  className="text-xs text-primary hover:underline"
                >
                  View all ({timelineQ.data?.length || 0}) →
                </button>
              </div>
              <ul className="space-y-3">
                {(timelineQ.data || [])
                  .slice(-8)
                  .reverse()
                  .map((e) => (
                    <li key={e.id} className="border-l-2 border-primary/50 pl-3 py-0.5">
                      <p className="text-sm text-foreground font-medium">{e.title}</p>
                      {e.description && (
                        <p className="text-xs text-muted-foreground truncate">{e.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(e.event_at).toLocaleString()}
                      </p>
                    </li>
                  ))}
                {!timelineQ.data?.length && (
                  <p className="text-xs text-muted-foreground">No timeline events recorded</p>
                )}
              </ul>
            </div>
          </div>

          {/* CASE INVESTIGATION TEAM & HIERARCHY SECTION */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">Case Investigation Team</h3>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {totalTeamCount} Member{totalTeamCount === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Hierarchical structure: Investigator Lead and supporting team investigators.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveDirectChatUserId(undefined);
                    setShowChatModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors shadow-sm"
                >
                  <MessageSquare className="h-4 w-4" />
                  Investigation Group Chat
                </button>

                {canManageTeam && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInvIds([]);
                      setAddInvestigatorSearch("");
                      setShowAddInvestigatorModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
                  >
                    <UserPlus className="h-4 w-4" />
                    + Add Investigator
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-12">
              {/* INVESTIGATOR LEAD CARD (5 cols) */}
              <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border-2 border-amber-500/30 bg-amber-500/5 p-4 space-y-4 relative overflow-hidden shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                      <UserCheck className="h-3.5 w-3.5" /> Investigator Lead
                    </span>
                    {leadInvestigator ? (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">
                        Active Lead
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded uppercase">
                        Unassigned
                      </span>
                    )}
                  </div>

                  {leadInvestigator?.user ? (
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-amber-500/20 font-bold text-amber-600 dark:text-amber-400 text-lg border border-amber-500/30">
                        {leadInvestigator.user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-foreground truncate">
                          {leadInvestigator.user.full_name}
                          {leadInvestigator.user_id === currentUserId && (
                            <span className="ml-2 text-[10px] font-normal text-muted-foreground">(You)</span>
                          )}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">{leadInvestigator.user.email}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Assigned: {leadInvestigator.assigned_at ? new Date(leadInvestigator.assigned_at).toLocaleDateString() : "Case creation"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 py-1">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-amber-500/10 font-bold text-amber-600 dark:text-amber-400 text-base border border-dashed border-amber-500/30">
                        ?
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-foreground">No Investigator Lead Assigned</h4>
                        <p className="text-xs text-muted-foreground">
                          {isSupervisor
                            ? "Assign an investigator to lead this case and direct the investigation team."
                            : "A Superior Officer will assign a lead investigator to direct this case."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-amber-500/20">
                  {leadInvestigator?.user_id && leadInvestigator.user_id !== currentUserId && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDirectChatUserId(leadInvestigator.user_id);
                        setShowChatModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-sm"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-primary" />
                      Direct Message
                    </button>
                  )}

                  {canReassignLead && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedNewLeadId("");
                        setKeepPrevLead(true);
                        setShowReassignLeadModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/20 px-3.5 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/30 transition-colors shadow-sm"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      {leadInvestigator ? "Reassign Lead" : "Assign Investigator Lead"}
                    </button>
                  )}
                </div>
              </div>

              {/* TEAM INVESTIGATORS LIST CARD (7 cols) */}
              <div className="lg:col-span-7 rounded-xl border border-border bg-card/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    Team Investigators ({teamInvestigators.length})
                  </h4>
                  <span className="text-[10px] text-muted-foreground">
                    {isCaseLead ? "Managed by you" : isSupervisor ? "Managed by Lead & Superior" : "Managed by Investigator Lead"}
                  </span>
                </div>

                {teamInvestigators.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center space-y-1.5">
                    <p className="text-xs font-medium text-foreground">No additional investigators assigned</p>
                    <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                      {canManageTeam
                        ? "Use '+ Add Investigator' above to assign investigators under the Lead to collaborate on this case."
                        : "The Investigator Lead manages this case team and can add investigators to assist."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {teamInvestigators.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/80 p-2.5 transition-colors hover:border-primary/30 shadow-sm"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {inv.user?.full_name?.charAt(0).toUpperCase() || "I"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">
                              {inv.user?.full_name || inv.user_id}
                              {inv.user_id === currentUserId && (
                                <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">(You)</span>
                              )}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">{inv.user?.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {inv.user_id !== currentUserId && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDirectChatUserId(inv.user_id);
                                setShowChatModal(true);
                              }}
                              title="Send direct message"
                              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
                            >
                              <MessageSquare className="h-3 w-3 text-primary" />
                              Message
                            </button>
                          )}

                          {canManageTeam && (
                            <button
                              type="button"
                              disabled={removeTeamMutation.isPending}
                              onClick={() => {
                                if (window.confirm(`Remove ${inv.user?.full_name || "investigator"} from this case team?`)) {
                                  removeTeamMutation.mutate(inv.user_id);
                                }
                              }}
                              title="Remove from team"
                              className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "evidence" && (
        <EvidenceSection
          evidenceList={evidenceList}
          isUploading={upload.isPending}
          onUpload={(file, desc, tags) => upload.mutate({ file, description: desc, tags })}
          onDelete={async (id) => {
            await investigationApi.deleteEvidence(id);
            toast.success("Evidence deleted");
            void qc.invalidateQueries({ queryKey: ["evidence", resolvedCaseId] });
            void qc.invalidateQueries({ queryKey: ["activity"] });
          }}
        />
      )}

      {tab === "notes" && (
        <NotesPanel
          notes={notesQ.data || []}
          onAdd={(body) => addNote.mutate(body)}
          onPin={async (id, pinned) => {
            await investigationApi.updateNote(id, { is_pinned: pinned });
            void qc.invalidateQueries({ queryKey: ["notes", resolvedCaseId] });
          }}
          onDelete={async (id) => {
            await investigationApi.deleteNote(id);
            void qc.invalidateQueries({ queryKey: ["notes", resolvedCaseId] });
            void qc.invalidateQueries({ queryKey: ["activity"] });
          }}
        />
      )}

      {tab === "timeline" && (
        <TimelineSection
          events={timelineQ.data || []}
          evidenceList={evidenceList}
          filterEvidenceId={timelineEvidenceFilter}
          onFilterChange={setTimelineEvidenceFilter}
          onAdd={(payload) => addTimeline.mutate(payload)}
          onDelete={async (id) => {
            await investigationApi.deleteTimeline(id);
            toast.success("Event deleted");
            void qc.invalidateQueries({ queryKey: ["timeline", resolvedCaseId] });
          }}
        />
      )}

      {tab === "relationships" && (
        <RelationshipSection
          relationships={relQ.data || []}
          onSubmit={(p) => addRel.mutate(p)}
          onDelete={async (id) => {
            await investigationApi.deleteRelationship(id);
            toast.success("Relationship removed");
            void qc.invalidateQueries({ queryKey: ["relationships", resolvedCaseId] });
            void qc.invalidateQueries({ queryKey: ["activity"] });
          }}
        />
      )}

      {tab === "leads" && (
        <LeadsSection
          leads={leadsQ.data || []}
          evidenceList={evidenceList}
          onCreate={(p) => addLead.mutate(p)}
          onUpdateStatus={(id, status, comment) =>
            updateLeadStatus.mutate({ id, status, review_comment: comment })
          }
          onDelete={async (id) => {
            await investigationApi.deleteLead(id);
            toast.success("Lead deleted");
            void qc.invalidateQueries({ queryKey: ["leads", resolvedCaseId] });
            void qc.invalidateQueries({ queryKey: ["activity"] });
          }}
        />
      )}

      {tab === "reports" && (
        <ReportsSection reports={reportsQ.data || []} onGenerate={(p) => genReport.mutate(p)} />
      )}

      {tab === "activity" && (
        <ActivitySection activities={activityQ.data?.items || []} caseId={resolvedCaseId} />
      )}

      {/* Supervisor Request Changes Modal */}
      {showRequestChangesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Request Case Revisions</h3>
                <p className="text-xs text-muted-foreground">
                  Specify mandatory feedback for assigned investigators
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Supervisor Feedback & Required Changes <span className="text-amber-500">*</span>
              </label>
              <textarea
                rows={4}
                value={requestChangesComment}
                onChange={(e) => setRequestChangesComment(e.target.value)}
                placeholder="Detail what evidence needs further analysis, missing leads, or report updates..."
                className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder-muted-foreground focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowRequestChangesModal(false);
                  setRequestChangesComment("");
                }}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!requestChangesComment.trim() || reviewCase.isPending}
                onClick={() =>
                  reviewCase.mutate({
                    action: "request_changes",
                    review_comment: requestChangesComment.trim(),
                  })
                }
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition-colors"
              >
                {reviewCase.isPending ? "Submitting..." : "Send Feedback & Request Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supervisor Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-500">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Authorize & Approve Case</h3>
                <p className="text-xs text-muted-foreground">
                  Sign off on all investigation findings and evidence
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Approval Note (Optional)
              </label>
              <textarea
                rows={3}
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
                placeholder="Add any final sign-off notes or instructions..."
                className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder-muted-foreground focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowApproveModal(false);
                  setApproveComment("");
                }}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reviewCase.isPending}
                onClick={() =>
                  reviewCase.mutate({
                    action: "approve",
                    review_comment: approveComment.trim() || undefined,
                  })
                }
                className="rounded-xl bg-emerald-600 dark:bg-emerald-500 px-4 py-2 text-xs font-bold text-white dark:text-slate-950 hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
                {reviewCase.isPending ? "Approving..." : "Confirm Sign-off & Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Team Investigator Modal */}
      {showAddInvestigatorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Add Team Investigators</h3>
                  <p className="text-xs text-muted-foreground">
                    Assign additional investigators under the Lead to collaborate on Case{" "}
                    <span className="font-mono text-primary font-semibold">{resolvedCaseNumber}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddInvestigatorModal(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={addInvestigatorSearch}
                onChange={(e) => setAddInvestigatorSearch(e.target.value)}
                placeholder="Search investigators by name or email..."
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px]">
              {availableInvestigators.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  No eligible unassigned investigators found.
                </div>
              ) : (
                availableInvestigators.map((user) => {
                  const isSelected = selectedInvIds.includes(user.id);
                  return (
                    <label
                      key={user.id}
                      className={`flex items-center justify-between gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border bg-background/60 hover:border-border/80 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInvIds([...selectedInvIds, user.id]);
                            } else {
                              setSelectedInvIds(selectedInvIds.filter((id) => id !== user.id));
                            }
                          }}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{user.full_name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
                        Investigator
                      </span>
                    </label>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-xs font-medium text-muted-foreground">
                Selected: <strong className="text-primary">{selectedInvIds.length}</strong> investigator(s)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddInvestigatorModal(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedInvIds.length === 0 || addTeamMutation.isPending}
                  onClick={() => addTeamMutation.mutate(selectedInvIds)}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-md"
                >
                  {addTeamMutation.isPending ? "Assigning..." : `Assign Selected (${selectedInvIds.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reassign / Assign Investigator Lead Modal (Superior Officers only) */}
      {showReassignLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/20 text-amber-500">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {leadInvestigator ? "Reassign Investigator Lead" : "Assign Investigator Lead"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {leadInvestigator
                    ? `Transfer case leadership for ${resolvedCaseNumber}`
                    : `Establish Investigator Lead for ${resolvedCaseNumber}`}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Select Investigator Lead <span className="text-amber-500">*</span>
                </label>
                <select
                  value={selectedNewLeadId}
                  onChange={(e) => setSelectedNewLeadId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground focus:border-amber-500 focus:outline-none"
                >
                  <option value="">-- Select Investigator --</option>
                  {eligibleLeadInvestigators.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              {leadInvestigator && (
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={keepPrevLead}
                    onChange={(e) => setKeepPrevLead(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span>Keep previous lead ({leadInvestigator.user?.full_name}) as active team investigator</span>
                </label>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <button
                type="button"
                onClick={() => setShowReassignLeadModal(false)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedNewLeadId || reassignLeadMutation.isPending}
                onClick={() =>
                  reassignLeadMutation.mutate({
                    new_investigator_lead_id: selectedNewLeadId,
                    keep_previous_as_investigator: keepPrevLead,
                  })
                }
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition-colors shadow-md"
              >
                {reassignLeadMutation.isPending
                  ? "Assigning..."
                  : leadInvestigator
                    ? "Confirm Reassignment"
                    : "Confirm Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Chat Modal / Drawer */}
      {showChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-6">
          <div className="relative flex h-full max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <ChatInterface
              initialCaseId={resolvedCaseId}
              initialCaseNumber={resolvedCaseNumber}
              initialCaseTitle={c.title}
              initialTargetUserId={activeDirectChatUserId}
              caseTeamMembers={[
                ...(leadInvestigator ? [leadInvestigator] : []),
                ...teamInvestigators,
                ...(c.supervisor
                  ? [
                      {
                        id: `sup-${c.supervisor.id}`,
                        case_id: resolvedCaseId,
                        user_id: c.supervisor.id,
                        role: "SUPERVISOR",
                        status: "active",
                        assigned_at: c.created_at,
                        user: {
                          id: c.supervisor.id,
                          full_name: c.supervisor.full_name,
                          email: c.supervisor.email,
                          role: "supervisor",
                        },
                      } as CaseInvestigator,
                    ]
                  : []),
              ]}
              onClose={() => setShowChatModal(false)}
              isEmbedded={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ActivitySection({ activities, caseId }: { activities: ActivityItem[]; caseId: string }) {
  const scoped = activities.filter((a) => !a.case_id || a.case_id === caseId);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Audit Activity History</h3>
        <p className="text-xs text-muted-foreground mt-1">Role-stamped actions recorded for this case.</p>
      </div>
      {scoped.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No audit activity recorded for this case yet.</p>
      ) : (
        <ol className="space-y-3">
          {scoped.map((a) => (
            <li key={a.id} className="rounded-xl border border-border bg-muted/40 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">
                    {a.action.replace(/_/g, " ")}
                  </p>
                  <p className="text-sm text-foreground mt-1">{a.description}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {a.user?.full_name || "System"}
                    {a.actor_role ? ` · ${a.actor_role.replace(/_/g, " ")}` : ""}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                  {new Date(a.created_at).toLocaleString()}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* =========================================================================
   WORKFLOW PROGRESS BAR
   ========================================================================= */
function CaseWorkflowProgressBar({ status }: { status: CaseStatus }) {
  const steps = [
    { key: "open", label: "1. Open", desc: "Case Initiated" },
    { key: "in_progress", label: "2. In Progress", desc: "Evidence & Leads" },
    { key: "under_review", label: "3. Under Review", desc: "Supervisor Oversight" },
    {
      key: status === "changes_requested" ? "changes_requested" : "approved",
      label: status === "changes_requested" ? "4. Changes Requested" : "4. Approved",
      desc: status === "changes_requested" ? "Revision Required" : "Supervisor Passed",
    },
    { key: "closed", label: "5. Closed", desc: "Archived / Final" },
  ];

  const getActiveIndex = (s: CaseStatus) => {
    switch (s) {
      case "open":
        return 0;
      case "in_progress":
      case "evidence_collection":
      case "analysis":
        return 1;
      case "under_review":
        return 2;
      case "changes_requested":
      case "approved":
        return 3;
      case "closed":
      case "completed":
      case "archived":
        return 4;
      default:
        return 0;
    }
  };

  const activeIdx = getActiveIndex(status);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Investigation Lifecycle Workflow
        </h4>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
          Current State: {formatLabel(status)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {steps.map((step, idx) => {
          const isPassed = idx < activeIdx;
          const isCurrent = idx === activeIdx;
          const isChanges = isCurrent && status === "changes_requested";
          const isApproved = (isCurrent || isPassed) && status === "approved" && idx === 3;

          return (
            <div
              key={step.key}
              className={`relative flex flex-col justify-between rounded-xl border p-3 transition-all ${
                isChanges
                  ? "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-200"
                  : isApproved
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-200"
                    : isCurrent
                      ? "border-primary/50 bg-primary/10 text-primary font-semibold"
                      : isPassed
                        ? "border-border bg-muted/60 text-foreground"
                        : "border-border/60 bg-muted/30 text-muted-foreground"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold uppercase">{step.label}</span>
                {isPassed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : isChanges ? (
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 animate-pulse" />
                ) : isCurrent ? (
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                )}
              </div>
              <p className="text-[11px] font-medium opacity-90 truncate">{step.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================================
   ========================================================================= */
function EvidenceSection({
  evidenceList,
  isUploading,
  onUpload,
  onDelete,
}: {
  evidenceList: EvidenceItem[];
  isUploading: boolean;
  onUpload: (file: File, description?: string, tags?: string[]) => void;
  onDelete: (id: string) => void;
}) {
  const [uploadMode, setUploadMode] = useState<"file" | "folder">("file");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [showModal, setShowModal] = useState(false);

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;
    const tags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    for (const f of selectedFiles) {
      onUpload(f, description || undefined, tags.length ? tags : undefined);
    }
    setSelectedFiles([]);
    setDescription("");
    setTagsStr("");
    setShowModal(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-foreground">
          Evidence Vault ({evidenceList.length})
        </h3>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Upload className="h-4 w-4" /> Upload Evidence
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-foreground">Upload Case Evidence</h3>

            {/* Mode selector: File vs Folder */}
            <div className="flex rounded-xl bg-muted p-1 border border-border">
              <button
                type="button"
                onClick={() => {
                  setUploadMode("file");
                  setSelectedFiles([]);
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                  uploadMode === "file"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                📄 Upload File(s)
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadMode("folder");
                  setSelectedFiles([]);
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                  uploadMode === "folder"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                📁 Upload Entire Folder
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  {uploadMode === "folder" ? "Select Folder *" : "Select File(s) *"}
                </label>
                {uploadMode === "file" ? (
                  <input
                    type="file"
                    multiple
                    required
                    onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                    className="w-full text-xs text-foreground file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                ) : (
                  <input
                    type="file"
                    {...({
                      webkitdirectory: "",
                      directory: "",
                    } as React.InputHTMLAttributes<HTMLInputElement>)}
                    multiple
                    required
                    onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                    className="w-full text-xs text-foreground file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                )}
                {uploadMode === "folder" && (
                  <p className="mt-1 text-[11px] text-primary">
                    💡 Selecting a folder will import all contained files preserving directory
                    structure.
                  </p>
                )}
              </div>

              {/* Selected Files Count / Preview */}
              {selectedFiles.length > 0 && (
                <div className="max-h-28 overflow-y-auto rounded-xl border border-border bg-background p-2 space-y-1">
                  <p className="text-[11px] font-semibold text-foreground mb-1">
                    {selectedFiles.length} file(s) ready to upload:
                  </p>
                  {selectedFiles.map((f, idx) => (
                    <p key={idx} className="text-[10px] text-muted-foreground font-mono truncate">
                      • {f.webkitRelativePath || f.name} ({(f.size / 1024).toFixed(1)} KB)
                    </p>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Context or notes about these files..."
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  placeholder="e.g. mobile, chat_log, suspect"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedFiles.length === 0 || isUploading}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isUploading
                    ? "Uploading..."
                    : `Upload ${selectedFiles.length > 1 ? `${selectedFiles.length} Files` : "Evidence"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {evidenceList.map((item) => {
          const hash = item.file_hash || item.sha256_hash;
          const exif = item.metadata_json?.exif;
          const warning =
            item.warning ||
            (item.is_duplicate ? "Duplicate file detected (matching hash in case)" : null);

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-border bg-card p-4 space-y-3 flex flex-col justify-between"
            >
              <div>
                {/* Duplicate Warning Banner */}
                {item.is_duplicate && (
                  <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-600 dark:text-amber-300">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{warning || "Duplicate File Warning"}</span>
                  </div>
                )}

                <div className="flex justify-between items-start gap-2">
                  <p
                    className="truncate text-sm font-semibold text-foreground"
                    title={item.original_name}
                  >
                    {item.original_name}
                  </p>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-mono text-primary uppercase">
                    {item.file_type}
                  </span>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  Size: {(item.file_size / 1024).toFixed(1)} KB · Uploaded{" "}
                  {new Date(item.upload_date).toLocaleDateString()}
                </p>

                {/* SHA256 Hash Display */}
                <div className="mt-2 rounded-lg bg-background p-2 border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    SHA-256 Hash
                  </p>
                  <p
                    className="truncate font-mono text-[10px] text-foreground select-all"
                    title={hash}
                  >
                    {hash}
                  </p>
                </div>

                {/* EXIF / File Metadata rendering */}
                {exif && (
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer text-[11px] text-primary hover:underline font-medium">
                      📷 EXIF / Device Metadata ({Object.keys(exif).length} fields)
                    </summary>
                    <div className="mt-1 space-y-0.5 rounded-lg bg-background p-2 font-mono text-[10px] text-foreground border border-border">
                      {exif.Make && <p>Make: {exif.Make}</p>}
                      {exif.Model && <p>Model: {exif.Model}</p>}
                      {exif.DateTimeOriginal && <p>Photo Time: {exif.DateTimeOriginal}</p>}
                      {exif.width && exif.height && (
                        <p>
                          Dimensions: {exif.width}x{exif.height}
                        </p>
                      )}
                      {exif.GPSInfo && <p>GPS: {JSON.stringify(exif.GPSInfo)}</p>}
                    </div>
                  </details>
                )}

                {item.description && (
                  <p className="mt-2 text-xs text-muted-foreground italic">"{item.description}"</p>
                )}
              </div>

              <div className="pt-3 border-t border-border flex gap-2 justify-end">
                <a
                  href={investigationApi.downloadEvidenceUrl(item.id)}
                  onClick={async (e) => {
                    e.preventDefault();
                    const token = getToken();
                    const res = await fetch(investigationApi.downloadEvidenceUrl(item.id), {
                      headers: token ? { Authorization: `Bearer ${token}` } : {},
                    });
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = item.original_name;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs text-foreground hover:bg-muted/80 transition-colors"
                >
                  <Download className="h-3 w-3" /> Download
                </a>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg bg-destructive/10 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/20 transition-colors"
                  onClick={() => onDelete(item.id)}
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================================
   RELATIONSHIP SECTION
   ========================================================================= */
function RelationshipSection({
  relationships,
  onSubmit,
  onDelete,
}: {
  relationships: RelationshipItem[];
  onSubmit: (p: {
    source_label: string;
    source_kind: EntityKind;
    source_id: string;
    target_label: string;
    target_kind: EntityKind;
    target_id: string;
    relationship_type: RelationshipType;
    description?: string;
  }) => void;
  onDelete: (id: string) => void;
}) {
  const [srcLabel, setSrcLabel] = useState("");
  const [srcKind, setSrcKind] = useState<EntityKind>("person");
  const [tgtLabel, setTgtLabel] = useState("");
  const [tgtKind, setTgtKind] = useState<EntityKind>("device");
  const [relType, setRelType] = useState<RelationshipType>("person_to_device");
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!srcLabel.trim() || !tgtLabel.trim()) return;
    onSubmit({
      source_label: srcLabel.trim(),
      source_kind: srcKind,
      source_id: srcLabel.trim().toLowerCase().replace(/\s+/g, "-"),
      target_label: tgtLabel.trim(),
      target_kind: tgtKind,
      target_id: tgtLabel.trim().toLowerCase().replace(/\s+/g, "-"),
      relationship_type: relType,
      description: note.trim() || undefined,
    });
    setSrcLabel("");
    setTgtLabel("");
    setNote("");
  };

  const entityKinds: EntityKind[] = [
    "person",
    "phone",
    "email",
    "location",
    "device",
    "organization",
    "evidence",
    "other",
  ];
  const relTypes: RelationshipType[] = [
    "evidence_to_evidence",
    "evidence_to_person",
    "evidence_to_device",
    "evidence_to_location",
    "person_to_person",
    "person_to_device",
    "other",
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Manual Relationship Linker</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Entity A */}
            <div className="space-y-2 rounded-xl border border-border bg-background p-3">
              <p className="text-xs font-semibold text-primary">Entity A (Source)</p>
              <input
                type="text"
                required
                value={srcLabel}
                onChange={(e) => setSrcLabel(e.target.value)}
                placeholder="Name / Label (e.g. John Doe, +123456...)"
                className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground"
              />
              <select
                value={srcKind}
                onChange={(e) => setSrcKind(e.target.value as EntityKind)}
                className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground"
              >
                {entityKinds.map((k) => (
                  <option key={k} value={k}>
                    Kind: {k}
                  </option>
                ))}
              </select>
            </div>

            {/* Entity B */}
            <div className="space-y-2 rounded-xl border border-border bg-background p-3">
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Entity B (Target)</p>
              <input
                type="text"
                required
                value={tgtLabel}
                onChange={(e) => setTgtLabel(e.target.value)}
                placeholder="Name / Label (e.g. iPhone 13, Suspect Org)"
                className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground"
              />
              <select
                value={tgtKind}
                onChange={(e) => setTgtKind(e.target.value as EntityKind)}
                className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground"
              >
                {entityKinds.map((k) => (
                  <option key={k} value={k}>
                    Kind: {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Relationship Type</label>
              <select
                value={relType}
                onChange={(e) => setRelType(e.target.value as RelationshipType)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground"
              >
                {relTypes.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Free-text Connection Note</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Investigator explanation of connection..."
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              + Add Relationship Link
            </button>
          </div>
        </form>
      </div>

      {/* Relationships Table / List */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Case Relationships ({relationships.length})
        </h3>
        {relationships.length === 0 ? (
          <p className="text-xs text-muted-foreground">No relationships mapped yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {relationships.map((r) => (
              <div
                key={r.id}
                className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">{r.source_label}</span>
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                      {r.source_kind}
                    </span>
                    <span className="text-muted-foreground font-mono">
                      -[ {r.relationship_type.replace(/_/g, " ")} ]-➔
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{r.target_label}</span>
                    <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                      {r.target_kind}
                    </span>
                  </div>
                  {r.description && (
                    <p className="text-muted-foreground text-xs italic">Note: {r.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(r.id)}
                  className="text-xs text-destructive hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   LEADS SECTION
   ========================================================================= */
function LeadsSection({
  leads,
  evidenceList,
  onCreate,
  onUpdateStatus,
  onDelete,
}: {
  leads: LeadItem[];
  evidenceList: EvidenceItem[];
  onCreate: (p: {
    title: string;
    description?: string;
    priority: LeadPriority;
    justification?: string;
    related_evidence_ids?: string[];
  }) => void;
  onUpdateStatus: (id: string, status: LeadStatus, comment?: string) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<LeadPriority>("medium");
  const [justification, setJustification] = useState("");
  const [selectedEvIds, setSelectedEvIds] = useState<string[]>([]);
  const [reviewCommentMap, setReviewCommentMap] = useState<Record<string, string>>({});

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      justification: justification.trim() || undefined,
      related_evidence_ids: selectedEvIds,
    });
    setTitle("");
    setDescription("");
    setJustification("");
    setSelectedEvIds([]);
  };

  const toggleEvidence = (id: string) => {
    setSelectedEvIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-5">
      {/* Create Lead Form */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Create Investigation Lead</h3>
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Lead Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Verify IP address ownership"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Priority (Manual Selection) *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as LeadPriority)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Lead Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of action items..."
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Justification Text * (Investigator explanation of flagging)
            </label>
            <textarea
              required
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explain why this lead is flagged and relevant to the case..."
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground"
              rows={2}
            />
          </div>

          {/* Evidence Multi-select */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Link Evidence Items (Multi-select)
            </label>
            <div className="max-h-32 overflow-y-auto rounded-xl border border-border bg-background p-2 space-y-1">
              {evidenceList.length === 0 ? (
                <p className="text-xs text-muted-foreground">No evidence uploaded yet.</p>
              ) : (
                evidenceList.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2 text-xs text-foreground cursor-pointer hover:bg-muted p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEvIds.includes(item.id)}
                      onChange={() => toggleEvidence(item.id)}
                      className="rounded border-border bg-card"
                    />
                    <span>{item.original_name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">({item.file_type})</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Create Lead
            </button>
          </div>
        </form>
      </div>

      {/* Leads List / Superior Officer Review Queue */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Leads & Review Queue ({leads.length})
        </h3>
        <div className="space-y-3">
          {leads.map((l) => (
            <div
              key={l.id}
              className="rounded-xl border border-border bg-background p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-foreground">{l.title}</h4>
                  <Badge className={priorityBadgeClass(l.priority)}>{l.priority}</Badge>
                </div>
                <Badge className={statusBadgeClass(l.status)}>{l.status}</Badge>
              </div>

              {l.description && <p className="text-xs text-muted-foreground">{l.description}</p>}

              {/* Justification Box */}
              {l.justification && (
                <div className="rounded-lg bg-card p-2.5 border border-border">
                  <p className="text-[10px] text-primary uppercase font-bold">
                    Investigator Justification
                  </p>
                  <p className="text-xs text-foreground mt-0.5">{l.justification}</p>
                </div>
              )}

              {/* Review Comment Box */}
              {l.review_comment && (
                <div className="rounded-lg bg-primary/5 p-2.5 border border-primary/20">
                  <p className="text-[10px] text-primary uppercase font-bold">
                    Superior Officer Review Comment
                  </p>
                  <p className="text-xs text-foreground mt-0.5">{l.review_comment}</p>
                </div>
              )}

              {/* Action Bar for Superior Officer / Investigator */}
              <div className="pt-2 border-t border-border space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <input
                    type="text"
                    placeholder="Review comment (optional)..."
                    value={reviewCommentMap[l.id] || ""}
                    onChange={(e) =>
                      setReviewCommentMap({ ...reviewCommentMap, [l.id]: e.target.value })
                    }
                    className="flex-1 min-w-[200px] rounded-lg border border-border bg-card px-3 py-1 text-xs text-foreground"
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(l.id, "approved", reviewCommentMap[l.id])}
                      className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(l.id, "rejected", reviewCommentMap[l.id])}
                      className="rounded-lg bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-500 hover:bg-red-500/30"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(l.id)}
                      className="rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground hover:bg-muted/80"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   TIMELINE SECTION
   ========================================================================= */
function TimelineSection({
  events,
  evidenceList,
  filterEvidenceId,
  onFilterChange,
  onAdd,
  onDelete,
}: {
  events: TimelineItem[];
  evidenceList: EvidenceItem[];
  filterEvidenceId: string;
  onFilterChange: (id: string) => void;
  onAdd: (p: {
    title: string;
    description?: string;
    event_type?: string;
    event_at?: string;
    related_evidence_id?: string;
  }) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("manual");
  const [eventAt, setEventAt] = useState("");
  const [relEvId, setRelEvId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      description: description.trim() || undefined,
      event_type: eventType,
      event_at: eventAt ? new Date(eventAt).toISOString() : undefined,
      related_evidence_id: relEvId || undefined,
    });
    setTitle("");
    setDescription("");
    setEventAt("");
    setRelEvId("");
  };

  const filteredEvents = events.filter((e) => {
    if (filterEvidenceId !== "all" && e.related_evidence_id !== filterEvidenceId) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Add Event Form */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Manual Timeline Event Entry</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Event Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Suspect device confiscated"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Event Time (event_at)</label>
              <input
                type="datetime-local"
                value={eventAt}
                onChange={(e) => setEventAt(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground"
              >
                <option value="manual">Manual Entry</option>
                <option value="evidence_uploaded">Evidence Uploaded</option>
                <option value="status_updated">Status Updated</option>
                <option value="note_added">Note Added</option>
                <option value="lead_created">Lead Created</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Related Evidence (Optional)
              </label>
              <select
                value={relEvId}
                onChange={(e) => setRelEvId(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground"
              >
                <option value="">-- None --</option>
                {evidenceList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.original_name} ({item.file_type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Event Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Chronological notes..."
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground"
              rows={2}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Add Event
            </button>
          </div>
        </form>
      </div>

      {/* Filter & List */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Timeline Events</h3>
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Filter by Evidence:</span>
            <select
              value={filterEvidenceId}
              onChange={(e) => onFilterChange(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground"
            >
              <option value="all">All Events</option>
              {evidenceList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.original_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ol className="space-y-4">
          {filteredEvents.map((e) => (
            <li key={e.id} className="relative border-l-2 border-primary/50 pl-4 space-y-1">
              <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-primary" />
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-foreground">{e.title}</p>
                <button
                  type="button"
                  onClick={() => onDelete(e.id)}
                  className="text-[10px] text-destructive hover:underline"
                >
                  Delete
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="capitalize">{e.event_type}</span> ·{" "}
                {new Date(e.event_at).toLocaleString()}
              </p>
              {e.description && <p className="text-xs text-muted-foreground">{e.description}</p>}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* =========================================================================
   REPORTS SECTION
   ========================================================================= */
function ReportsSection({
  reports,
  onGenerate,
}: {
  reports: ReportItem[];
  onGenerate: (p: { title?: string; case_summary?: string; format: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [format, setFormat] = useState("html");
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      title: title.trim() || undefined,
      case_summary: summary.trim() || undefined,
      format,
    });
    setTitle("");
    setSummary("");
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Compile Case Report (Draft)</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Report Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Phase 1 Draft Report"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Manually Written Case Summary *
            </label>
            <textarea
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Investigator overview summary..."
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground"
              rows={3}
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="text-xs text-muted-foreground">Export Format:</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground"
            >
              <option value="html">HTML / PDF Print</option>
              <option value="csv">CSV Export</option>
            </select>
            <button
              type="submit"
              className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Generate Report
            </button>
          </div>
        </form>
      </div>

      {/* Generated Reports List */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Compiled Reports ({reports.length})
        </h3>
        <div className="space-y-2">
          {reports.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-xl border border-border bg-background p-3 text-xs"
            >
              <div>
                <p className="font-semibold text-foreground">{r.title}</p>
                <p className="text-muted-foreground">
                  {r.format.toUpperCase()} · {new Date(r.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(r)}
                  className="rounded bg-muted px-2.5 py-1 text-foreground hover:bg-muted/80"
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!r.content) return;
                    const w = window.open("", "_blank");
                    if (!w) return;
                    w.document.write(r.format === "csv" ? `<pre>${r.content}</pre>` : r.content);
                    w.document.close();
                    w.focus();
                    w.print();
                  }}
                  className="rounded bg-primary px-2.5 py-1 text-primary-foreground font-semibold hover:bg-primary/90"
                >
                  Print / Export PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card text-foreground p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-lg font-bold">{selectedReport.title}</h3>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="text-xs bg-muted px-3 py-1 rounded hover:bg-muted/80"
              >
                Close Preview
              </button>
            </div>
            <div
              className="prose text-xs max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: selectedReport.content || "<p>Empty report</p>" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function NotesPanel({
  notes,
  onAdd,
  onPin,
  onDelete,
}: {
  notes: {
    id: string;
    title: string | null;
    body: string;
    is_pinned: boolean;
    updated_at: string;
    author?: { full_name: string } | null;
  }[];
  onAdd: (body: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [v, setV] = useState("");
  return (
    <div className="space-y-4">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!v.trim()) return;
          onAdd(v.trim());
          setV("");
        }}
      >
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          placeholder="Write a markdown note..."
          className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
        />
        <button
          type="submit"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Add Note
        </button>
      </form>
      <ul className="space-y-3">
        {notes.map((n) => (
          <li key={n.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {n.author?.full_name || "Investigator"} · {new Date(n.updated_at).toLocaleString()}
                {n.is_pinned ? " · 📌 Pinned" : ""}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onPin(n.id, !n.is_pinned)}
                  className="text-muted-foreground hover:text-primary"
                >
                  <Pin className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(n.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">{n.body}</pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
