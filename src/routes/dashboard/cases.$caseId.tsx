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
} from "@/services/types";
import { getStoredCases, useEvidenceList } from "@/data/mock/platformState";

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

  return (
    <div className="space-y-5">
      {/* Header & Role Action Bar */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-white/10 bg-[#111827]/90 p-5 shadow-lg">
        <div className="space-y-1">
          <Link
            to="/dashboard/cases"
            className="text-xs text-cyan hover:underline inline-flex items-center gap-1"
          >
            ← Back to cases list
          </Link>
          <h1 className="text-2xl font-bold text-slate-50">{c.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="font-mono text-cyan font-semibold">{c.case_number}</span>
            <span>·</span>
            <span>Created by: {c.created_by?.full_name || "Investigator"}</span>
            {c.supervisor && (
              <>
                <span>·</span>
                <span className="text-slate-300">
                  Supervisor: <strong className="text-cyan">{c.supervisor.full_name}</strong>
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan/90 transition-all shadow-md hover:shadow-cyan/20 disabled:opacity-50"
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
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/20 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-colors"
              >
                <AlertTriangle className="h-3.5 w-3.5" /> Request Changes
              </button>
              <button
                type="button"
                onClick={() => setShowApproveModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors shadow-md hover:shadow-emerald-500/20"
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-200 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-white transition-colors disabled:opacity-50"
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
      <div className="flex flex-wrap gap-1 border-b border-white/10 pb-2">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t
                ? "bg-primary/20 text-primary border border-primary/30 font-semibold"
                : "text-slate-400 hover:bg-white/5"
            }`}
          >
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-white/10 bg-[#111827]/90 p-5">
            <h3 className="text-sm font-semibold text-slate-100">Case Details</h3>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">
              {c.description || "No description provided."}
            </p>

            {c.review_comment && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="text-xs font-bold text-amber-400 uppercase">
                  Supervisor Review Comment
                </p>
                <p className="text-xs text-slate-300 mt-1">{c.review_comment}</p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-white/5">
              <div className="block text-xs text-slate-400">
                Status
                <p className="mt-1">
                  <Badge className={statusBadgeClass(c.status)}>{formatLabel(c.status)}</Badge>
                </p>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Workflow status is changed by review actions, not this panel.
                </p>
              </div>
              <label className="block text-xs text-slate-400">
                Priority
                <select
                  value={c.priority}
                  onChange={(e) => updateCase.mutate({ priority: e.target.value as CasePriority })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm text-slate-200"
                >
                  {(["low", "medium", "high", "critical"] as CasePriority[]).map((p) => (
                    <option key={p} value={p}>
                      {formatLabel(p)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="pt-2 border-t border-white/5">
              <p className="text-xs text-slate-400 mb-1.5 font-medium">Assigned Personnel</p>
              <ul className="space-y-1.5 text-sm text-slate-200">
                {c.assignments.map((a) => (
                  <li key={a.id} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan" />
                    <span>{a.user?.full_name || a.user_id}</span>
                    {a.is_primary && (
                      <span className="text-[10px] text-cyan bg-cyan/10 px-1.5 py-0.5 rounded">
                        Primary
                      </span>
                    )}
                  </li>
                ))}
                {!c.assignments.length && (
                  <li className="text-xs text-slate-500">No personnel assigned</li>
                )}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111827]/90 p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-slate-100">Recent Activity Timeline</h3>
              <button
                type="button"
                onClick={() => setTab("timeline")}
                className="text-xs text-cyan hover:underline"
              >
                View all ({timelineQ.data?.length || 0}) →
              </button>
            </div>
            <ul className="space-y-3">
              {(timelineQ.data || [])
                .slice(-8)
                .reverse()
                .map((e) => (
                  <li key={e.id} className="border-l-2 border-cyan/50 pl-3 py-0.5">
                    <p className="text-sm text-slate-200 font-medium">{e.title}</p>
                    {e.description && (
                      <p className="text-xs text-slate-400 truncate">{e.description}</p>
                    )}
                    <p className="text-[10px] text-slate-500">
                      {new Date(e.event_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              {!timelineQ.data?.length && (
                <p className="text-xs text-slate-500">No timeline events recorded</p>
              )}
            </ul>
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
          <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-[#0f172a] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Request Case Revisions</h3>
                <p className="text-xs text-slate-400">
                  Specify mandatory feedback for assigned investigators
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Supervisor Feedback & Required Changes <span className="text-amber-400">*</span>
              </label>
              <textarea
                rows={4}
                value={requestChangesComment}
                onChange={(e) => setRequestChangesComment(e.target.value)}
                placeholder="Detail what evidence needs further analysis, missing leads, or report updates..."
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] p-3 text-sm text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowRequestChangesModal(false);
                  setRequestChangesComment("");
                }}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"
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
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-[#0f172a] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Authorize & Approve Case</h3>
                <p className="text-xs text-slate-400">
                  Sign off on all investigation findings and evidence
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Approval Note (Optional)
              </label>
              <textarea
                rows={3}
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
                placeholder="Add any final sign-off notes or instructions..."
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] p-3 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowApproveModal(false);
                  setApproveComment("");
                }}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"
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
                className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors"
              >
                {reviewCase.isPending ? "Approving..." : "Confirm Sign-off & Approve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivitySection({ activities, caseId }: { activities: ActivityItem[]; caseId: string }) {
  const scoped = activities.filter((a) => !a.case_id || a.case_id === caseId);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827]/90 p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-100">Audit Activity History</h3>
        <p className="text-xs text-slate-400 mt-1">Role-stamped actions recorded for this case.</p>
      </div>
      {scoped.length === 0 ? (
        <p className="text-sm text-slate-500 py-4">No audit activity recorded for this case yet.</p>
      ) : (
        <ol className="space-y-3">
          {scoped.map((a) => (
            <li key={a.id} className="rounded-xl border border-white/5 bg-[#0b1220]/80 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-cyan">
                    {a.action.replace(/_/g, " ")}
                  </p>
                  <p className="text-sm text-slate-200 mt-1">{a.description}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {a.user?.full_name || "System"}
                    {a.actor_role ? ` · ${a.actor_role.replace(/_/g, " ")}` : ""}
                  </p>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0 font-mono">
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
    <div className="rounded-2xl border border-white/10 bg-[#0f172a]/90 p-4 sm:p-5 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Investigation Lifecycle Workflow
        </h4>
        <span className="rounded-full bg-cyan/10 px-2.5 py-0.5 text-[11px] font-semibold text-cyan">
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
                  ? "border-amber-500/50 bg-amber-500/10 text-amber-200"
                  : isApproved
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
                    : isCurrent
                      ? "border-cyan/50 bg-cyan/10 text-cyan"
                      : isPassed
                        ? "border-white/10 bg-[#111827] text-slate-300"
                        : "border-white/5 bg-[#0b1220]/60 text-slate-500"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold uppercase">{step.label}</span>
                {isPassed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : isChanges ? (
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 animate-pulse" />
                ) : isCurrent ? (
                  <Clock className="h-4 w-4 text-cyan shrink-0" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-slate-600" />
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
        <h3 className="text-sm font-semibold text-slate-200">
          Evidence Vault ({evidenceList.length})
        </h3>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan/90 transition-colors"
        >
          <Upload className="h-4 w-4" /> Upload Evidence
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111827] p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Upload Case Evidence</h3>

            {/* Mode selector: File vs Folder */}
            <div className="flex rounded-xl bg-[#0b1220] p-1 border border-white/5">
              <button
                type="button"
                onClick={() => {
                  setUploadMode("file");
                  setSelectedFiles([]);
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                  uploadMode === "file"
                    ? "bg-cyan text-slate-950"
                    : "text-slate-400 hover:text-slate-200"
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
                    ? "bg-cyan text-slate-950"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                📁 Upload Entire Folder
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {uploadMode === "folder" ? "Select Folder *" : "Select File(s) *"}
                </label>
                {uploadMode === "file" ? (
                  <input
                    type="file"
                    multiple
                    required
                    onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                    className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-cyan/10 file:text-cyan hover:file:bg-cyan/20"
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
                    className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-cyan/10 file:text-cyan hover:file:bg-cyan/20"
                  />
                )}
                {uploadMode === "folder" && (
                  <p className="mt-1 text-[11px] text-cyan/80">
                    💡 Selecting a folder will import all contained files preserving directory
                    structure.
                  </p>
                )}
              </div>

              {/* Selected Files Count / Preview */}
              {selectedFiles.length > 0 && (
                <div className="max-h-28 overflow-y-auto rounded-xl border border-white/10 bg-[#0b1220] p-2 space-y-1">
                  <p className="text-[11px] font-semibold text-slate-300 mb-1">
                    {selectedFiles.length} file(s) ready to upload:
                  </p>
                  {selectedFiles.map((f, idx) => (
                    <p key={idx} className="text-[10px] text-slate-400 font-mono truncate">
                      • {f.webkitRelativePath || f.name} ({(f.size / 1024).toFixed(1)} KB)
                    </p>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Context or notes about these files..."
                  className="w-full rounded-xl border border-white/10 bg-[#0b1220] p-2.5 text-xs text-slate-200"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  placeholder="e.g. mobile, chat_log, suspect"
                  className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs text-slate-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedFiles.length === 0 || isUploading}
                  className="rounded-xl bg-cyan px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan/90 disabled:opacity-50"
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
              className="rounded-2xl border border-white/10 bg-[#111827]/90 p-4 space-y-3 flex flex-col justify-between"
            >
              <div>
                {/* Duplicate Warning Banner */}
                {item.is_duplicate && (
                  <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-300">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{warning || "Duplicate File Warning"}</span>
                  </div>
                )}

                <div className="flex justify-between items-start gap-2">
                  <p
                    className="truncate text-sm font-semibold text-slate-100"
                    title={item.original_name}
                  >
                    {item.original_name}
                  </p>
                  <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-mono text-cyan uppercase">
                    {item.file_type}
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  Size: {(item.file_size / 1024).toFixed(1)} KB · Uploaded{" "}
                  {new Date(item.upload_date).toLocaleDateString()}
                </p>

                {/* SHA256 Hash Display */}
                <div className="mt-2 rounded-lg bg-[#0b1220] p-2 border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    SHA-256 Hash
                  </p>
                  <p
                    className="truncate font-mono text-[10px] text-slate-300 select-all"
                    title={hash}
                  >
                    {hash}
                  </p>
                </div>

                {/* EXIF / File Metadata rendering */}
                {exif && (
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer text-[11px] text-cyan hover:underline font-medium">
                      📷 EXIF / Device Metadata ({Object.keys(exif).length} fields)
                    </summary>
                    <div className="mt-1 space-y-0.5 rounded-lg bg-[#0b1220] p-2 font-mono text-[10px] text-slate-300 border border-white/5">
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
                  <p className="mt-2 text-xs text-slate-300 italic">"{item.description}"</p>
                )}
              </div>

              <div className="pt-3 border-t border-white/5 flex gap-2 justify-end">
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
                  className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1 text-xs text-slate-300 hover:bg-white/10 transition-colors"
                >
                  <Download className="h-3 w-3" /> Download
                </a>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/20 transition-colors"
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
      <div className="rounded-2xl border border-white/10 bg-[#111827]/90 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-100">Manual Relationship Linker</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Entity A */}
            <div className="space-y-2 rounded-xl border border-white/5 bg-[#0b1220] p-3">
              <p className="text-xs font-semibold text-cyan">Entity A (Source)</p>
              <input
                type="text"
                required
                value={srcLabel}
                onChange={(e) => setSrcLabel(e.target.value)}
                placeholder="Name / Label (e.g. John Doe, +123456...)"
                className="w-full rounded-lg border border-white/10 bg-[#111827] px-3 py-1.5 text-xs text-slate-200"
              />
              <select
                value={srcKind}
                onChange={(e) => setSrcKind(e.target.value as EntityKind)}
                className="w-full rounded-lg border border-white/10 bg-[#111827] px-3 py-1.5 text-xs text-slate-200"
              >
                {entityKinds.map((k) => (
                  <option key={k} value={k}>
                    Kind: {k}
                  </option>
                ))}
              </select>
            </div>

            {/* Entity B */}
            <div className="space-y-2 rounded-xl border border-white/5 bg-[#0b1220] p-3">
              <p className="text-xs font-semibold text-emerald-400">Entity B (Target)</p>
              <input
                type="text"
                required
                value={tgtLabel}
                onChange={(e) => setTgtLabel(e.target.value)}
                placeholder="Name / Label (e.g. iPhone 13, Suspect Org)"
                className="w-full rounded-lg border border-white/10 bg-[#111827] px-3 py-1.5 text-xs text-slate-200"
              />
              <select
                value={tgtKind}
                onChange={(e) => setTgtKind(e.target.value as EntityKind)}
                className="w-full rounded-lg border border-white/10 bg-[#111827] px-3 py-1.5 text-xs text-slate-200"
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
              <label className="block text-xs text-slate-400 mb-1">Relationship Type</label>
              <select
                value={relType}
                onChange={(e) => setRelType(e.target.value as RelationshipType)}
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-xs text-slate-200"
              >
                {relTypes.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Free-text Connection Note</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Investigator explanation of connection..."
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-xs text-slate-200"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-cyan px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan/90"
            >
              + Add Relationship Link
            </button>
          </div>
        </form>
      </div>

      {/* Relationships Table / List */}
      <div className="rounded-2xl border border-white/10 bg-[#111827]/90 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-100">
          Case Relationships ({relationships.length})
        </h3>
        {relationships.length === 0 ? (
          <p className="text-xs text-slate-400">No relationships mapped yet.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {relationships.map((r) => (
              <div
                key={r.id}
                className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-cyan">{r.source_label}</span>
                    <span className="rounded bg-cyan/10 px-1.5 py-0.5 text-[10px] text-cyan">
                      {r.source_kind}
                    </span>
                    <span className="text-slate-500 font-mono">
                      -[ {r.relationship_type.replace(/_/g, " ")} ]-➔
                    </span>
                    <span className="font-semibold text-emerald-400">{r.target_label}</span>
                    <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-[10px] text-emerald-400">
                      {r.target_kind}
                    </span>
                  </div>
                  {r.description && (
                    <p className="text-slate-400 text-xs italic">Note: {r.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(r.id)}
                  className="text-xs text-red-400 hover:underline"
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
      <div className="rounded-2xl border border-white/10 bg-[#111827]/90 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-100">Create Investigation Lead</h3>
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Lead Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Verify IP address ownership"
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-xs text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Priority (Manual Selection) *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as LeadPriority)}
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-xs text-slate-200"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Lead Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of action items..."
              className="w-full rounded-xl border border-white/10 bg-[#0b1220] p-2.5 text-xs text-slate-200"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Justification Text * (Investigator explanation of flagging)
            </label>
            <textarea
              required
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explain why this lead is flagged and relevant to the case..."
              className="w-full rounded-xl border border-white/10 bg-[#0b1220] p-2.5 text-xs text-slate-200"
              rows={2}
            />
          </div>

          {/* Evidence Multi-select */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Link Evidence Items (Multi-select)
            </label>
            <div className="max-h-32 overflow-y-auto rounded-xl border border-white/10 bg-[#0b1220] p-2 space-y-1">
              {evidenceList.length === 0 ? (
                <p className="text-xs text-slate-500">No evidence uploaded yet.</p>
              ) : (
                evidenceList.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:bg-white/5 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEvIds.includes(item.id)}
                      onChange={() => toggleEvidence(item.id)}
                      className="rounded border-white/10 bg-[#111827]"
                    />
                    <span>{item.original_name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({item.file_type})</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-cyan px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan/90"
            >
              Create Lead
            </button>
          </div>
        </form>
      </div>

      {/* Leads List / Superior Officer Review Queue */}
      <div className="rounded-2xl border border-white/10 bg-[#111827]/90 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-100">
          Leads & Review Queue ({leads.length})
        </h3>
        <div className="space-y-3">
          {leads.map((l) => (
            <div
              key={l.id}
              className="rounded-xl border border-white/10 bg-[#0b1220] p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-100">{l.title}</h4>
                  <Badge className={priorityBadgeClass(l.priority)}>{l.priority}</Badge>
                </div>
                <Badge className={statusBadgeClass(l.status)}>{l.status}</Badge>
              </div>

              {l.description && <p className="text-xs text-slate-300">{l.description}</p>}

              {/* Justification Box */}
              {l.justification && (
                <div className="rounded-lg bg-[#111827] p-2.5 border border-white/5">
                  <p className="text-[10px] text-cyan uppercase font-bold">
                    Investigator Justification
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5">{l.justification}</p>
                </div>
              )}

              {/* Review Comment Box */}
              {l.review_comment && (
                <div className="rounded-lg bg-cyan/5 p-2.5 border border-cyan/20">
                  <p className="text-[10px] text-cyan uppercase font-bold">
                    Superior Officer Review Comment
                  </p>
                  <p className="text-xs text-slate-200 mt-0.5">{l.review_comment}</p>
                </div>
              )}

              {/* Action Bar for Superior Officer / Investigator */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <input
                    type="text"
                    placeholder="Review comment (optional)..."
                    value={reviewCommentMap[l.id] || ""}
                    onChange={(e) =>
                      setReviewCommentMap({ ...reviewCommentMap, [l.id]: e.target.value })
                    }
                    className="flex-1 min-w-[200px] rounded-lg border border-white/10 bg-[#111827] px-3 py-1 text-xs text-slate-200"
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(l.id, "approved", reviewCommentMap[l.id])}
                      className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(l.id, "rejected", reviewCommentMap[l.id])}
                      className="rounded-lg bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/30"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(l.id)}
                      className="rounded-lg bg-white/5 px-2 py-1 text-xs text-slate-400 hover:bg-white/10"
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
      <div className="rounded-2xl border border-white/10 bg-[#111827]/90 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-100">Manual Timeline Event Entry</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Event Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Suspect device confiscated"
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-xs text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Event Time (event_at)</label>
              <input
                type="datetime-local"
                value={eventAt}
                onChange={(e) => setEventAt(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-xs text-slate-200"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-xs text-slate-200"
              >
                <option value="manual">Manual Entry</option>
                <option value="evidence_uploaded">Evidence Uploaded</option>
                <option value="status_updated">Status Updated</option>
                <option value="note_added">Note Added</option>
                <option value="lead_created">Lead Created</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Related Evidence (Optional)
              </label>
              <select
                value={relEvId}
                onChange={(e) => setRelEvId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-xs text-slate-200"
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
            <label className="block text-xs text-slate-400 mb-1">Event Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Chronological notes..."
              className="w-full rounded-xl border border-white/10 bg-[#0b1220] p-2.5 text-xs text-slate-200"
              rows={2}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-cyan px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan/90"
            >
              Add Event
            </button>
          </div>
        </form>
      </div>

      {/* Filter & List */}
      <div className="rounded-2xl border border-white/10 bg-[#111827]/90 p-4 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-100">Timeline Events</h3>
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">Filter by Evidence:</span>
            <select
              value={filterEvidenceId}
              onChange={(e) => onFilterChange(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#0b1220] px-2.5 py-1 text-xs text-slate-200"
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
            <li key={e.id} className="relative border-l-2 border-cyan/40 pl-4 space-y-1">
              <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-cyan" />
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-slate-100">{e.title}</p>
                <button
                  type="button"
                  onClick={() => onDelete(e.id)}
                  className="text-[10px] text-red-400 hover:underline"
                >
                  Delete
                </button>
              </div>
              <p className="text-xs text-slate-400">
                <span className="capitalize">{e.event_type}</span> ·{" "}
                {new Date(e.event_at).toLocaleString()}
              </p>
              {e.description && <p className="text-xs text-slate-300">{e.description}</p>}
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
      <div className="rounded-2xl border border-white/10 bg-[#111827]/90 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-100">Compile Case Report (Draft)</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Report Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Phase 1 Draft Report"
              className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-xs text-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Manually Written Case Summary *
            </label>
            <textarea
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Investigator overview summary..."
              className="w-full rounded-xl border border-white/10 bg-[#0b1220] p-2.5 text-xs text-slate-200"
              rows={3}
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="text-xs text-slate-400">Export Format:</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#0b1220] px-3 py-1.5 text-xs text-slate-200"
            >
              <option value="html">HTML / PDF Print</option>
              <option value="csv">CSV Export</option>
            </select>
            <button
              type="submit"
              className="rounded-xl bg-cyan px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan/90"
            >
              Generate Report
            </button>
          </div>
        </form>
      </div>

      {/* Generated Reports List */}
      <div className="rounded-2xl border border-white/10 bg-[#111827]/90 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-100">
          Compiled Reports ({reports.length})
        </h3>
        <div className="space-y-2">
          {reports.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0b1220] p-3 text-xs"
            >
              <div>
                <p className="font-semibold text-slate-100">{r.title}</p>
                <p className="text-slate-400">
                  {r.format.toUpperCase()} · {new Date(r.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(r)}
                  className="rounded bg-white/10 px-2.5 py-1 text-slate-200 hover:bg-white/20"
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
                  className="rounded bg-cyan px-2.5 py-1 text-slate-950 font-semibold hover:bg-cyan/90"
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
          <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-white text-slate-900 p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold">{selectedReport.title}</h3>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="text-xs bg-slate-200 px-3 py-1 rounded hover:bg-slate-300"
              >
                Close Preview
              </button>
            </div>
            <div
              className="prose text-xs max-w-none"
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
          className="flex-1 rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-sm text-slate-200"
        />
        <button
          type="submit"
          className="rounded-xl bg-cyan px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan/90"
        >
          Add Note
        </button>
      </form>
      <ul className="space-y-3">
        {notes.map((n) => (
          <li key={n.id} className="rounded-2xl border border-white/10 bg-[#111827]/90 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs text-slate-400">
                {n.author?.full_name || "Investigator"} · {new Date(n.updated_at).toLocaleString()}
                {n.is_pinned ? " · 📌 Pinned" : ""}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onPin(n.id, !n.is_pinned)}
                  className="text-slate-400 hover:text-cyan"
                >
                  <Pin className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(n.id)}
                  className="text-slate-400 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-200">{n.body}</pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
