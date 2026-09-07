import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bell,
  Briefcase,
  CheckCircle2,
  Clock,
  FileStack,
  GitBranch,
  NotebookPen,
  Send,
  Timer,
  Upload,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";
import {
  AiPlaceholderCard,
  ChartCard,
  PageHeader,
  Panel,
  QuickActionCard,
  SkeletonGrid,
} from "@/components/layouts/DashboardWidgets";
import { StatsCard } from "@/components/layouts/StatsCard";
import {
  Badge,
  formatLabel,
  priorityBadgeClass,
  statusBadgeClass,
} from "@/components/dashboard/Badge";
import { investigationApi } from "@/services/investigationApi";

export const Route = createFileRoute("/investigator/dashboard")({
  component: InvestigatorDashboard,
});

function InvestigatorDashboard() {
  const navigate = useNavigate();
  const stats = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => investigationApi.dashboardStats(),
  });
  const cases = useQuery({
    queryKey: ["cases"],
    queryFn: () => investigationApi.listCases({ page_size: 50 }),
  });
  const activity = useQuery({
    queryKey: ["activity"],
    queryFn: () => investigationApi.activity(1),
  });
  const notifsQ = useQuery({
    queryKey: ["notifications"],
    queryFn: () => investigationApi.listNotifications(),
  });

  if (stats.isLoading) return <SkeletonGrid count={6} />;
  const d = stats.data;
  const caseItems = cases.data?.items || [];

  const totalAssigned = cases.data?.total || caseItems.length;
  const inProgressCount = caseItems.filter((c) =>
    ["in_progress", "evidence_collection", "analysis", "open"].includes(c.status),
  ).length;
  const underReviewCount = caseItems.filter((c) => c.status === "under_review").length;
  const changesRequestedCount = caseItems.filter((c) => c.status === "changes_requested").length;
  const approvedCount = caseItems.filter((c) =>
    ["approved", "completed", "closed", "archived"].includes(c.status),
  ).length;
  const unreadNotifs = (notifsQ.data || []).filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Investigator Workspace"
        subtitle="Manage assigned cases, upload digital evidence, address supervisor feedback, and submit findings"
      />

      {/* Dynamic Workflow Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Assigned Cases" value={totalAssigned} icon={Briefcase} />
        <StatsCard
          label="Under Review"
          value={underReviewCount}
          icon={Clock}
          tone="cyan"
          delay={0.08}
        />
        <StatsCard
          label="Changes Requested"
          value={changesRequestedCount}
          icon={AlertTriangle}
          tone="amber"
          hint={changesRequestedCount > 0 ? "Requires your attention" : "All clear"}
          delay={0.12}
        />
        <StatsCard
          label="Approved / Closed"
          value={approvedCount}
          icon={CheckCircle2}
          tone="emerald"
          delay={0.16}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          label="Evidence Uploaded"
          value={d?.evidence_uploaded || 0}
          icon={FileStack}
          tone="cyan"
          delay={0.2}
        />
        <StatsCard
          label="Unread Notifications"
          value={unreadNotifs}
          icon={Bell}
          tone={unreadNotifs > 0 ? "rose" : "primary"}
          delay={0.24}
        />
        <StatsCard
          label="Activity Logs"
          value={activity.data?.total || 0}
          icon={Timer}
          tone="primary"
          delay={0.28}
        />
      </div>

      {/* Feedback Banner if Changes Requested */}
      {changesRequestedCount > 0 && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200 flex items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 animate-pulse" />
            <div>
              <p className="text-sm font-bold text-amber-300">Supervisor Review Action Required</p>
              <p className="text-xs text-amber-200/80">
                You have {changesRequestedCount} case{changesRequestedCount > 1 ? "s" : ""} where
                supervisor revisions have been requested.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void navigate({ to: "/investigator/cases" })}
            className="shrink-0 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
          >
            Review Feedback →
          </button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Evidence Upload Statistics">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d?.evidence_types || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="type" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
                <Bar dataKey="count" fill="#06B6D4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Investigation Trajectory">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d?.monthly_cases || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
                <Area type="monotone" dataKey="count" stroke="#3B82F6" fill="#3B82F633" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Assigned Investigation Cases">
          <ul className="space-y-2.5">
            {caseItems.slice(0, 8).map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#0b1220]/60 p-3 hover:border-cyan/30 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    to="/investigator/cases/$caseId"
                    params={{ caseId: c.id }}
                    className="text-sm font-semibold text-slate-200 hover:text-cyan hover:underline truncate block"
                  >
                    {c.case_number} · {c.title}
                  </Link>
                  <p className="text-xs text-slate-400 truncate">
                    Supervisor: {c.supervisor?.full_name || "Unassigned"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge className={priorityBadgeClass(c.priority)}>
                    {formatLabel(c.priority)}
                  </Badge>
                  <Badge className={statusBadgeClass(c.status)}>{formatLabel(c.status)}</Badge>
                </div>
              </li>
            ))}
            {!caseItems.length && (
              <p className="text-sm text-slate-500 py-2">No assigned cases yet</p>
            )}
          </ul>
        </Panel>

        <Panel title="Recent Workflow & Audit Activity">
          <ul className="space-y-2.5">
            {(activity.data?.items || []).slice(0, 8).map((a) => (
              <li
                key={a.id}
                className="flex items-start justify-between gap-2 text-xs border-b border-white/5 pb-2"
              >
                <div>
                  <span className="font-semibold text-slate-200">{a.description}</span>
                  <p className="text-[11px] text-slate-400">By {a.user?.full_name || "System"}</p>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                  {new Date(a.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
            {!(activity.data?.items || []).length && (
              <p className="text-sm text-slate-500 py-2">No recent activity</p>
            )}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QuickActionCard
          label="Upload Evidence"
          description="Attach files to a case"
          icon={Upload}
          onClick={() => void navigate({ to: "/investigator/upload" })}
        />
        <QuickActionCard
          label="Add Notes"
          description="Markdown investigation notes"
          icon={NotebookPen}
          onClick={() => void navigate({ to: "/investigator/notes" })}
        />
        <QuickActionCard
          label="Create Manual Lead"
          description="Track a new lead"
          icon={GitBranch}
          onClick={() => void navigate({ to: "/investigator/leads" })}
        />
        <QuickActionCard
          label="View Timeline"
          description="Chronological case events"
          icon={Timer}
          onClick={() => void navigate({ to: "/investigator/timeline" })}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AiPlaceholderCard title="OCR Results" blurb="Reserved on evidence.ocr_text" />
        <AiPlaceholderCard title="Speech-to-Text" blurb="Reserved on evidence.speech_transcript" />
        <AiPlaceholderCard title="Object Detection" blurb="Reserved on evidence.detected_objects" />
        <AiPlaceholderCard title="AI Leads" blurb="Manual leads only in Phase 1" />
      </div>
    </div>
  );
}
