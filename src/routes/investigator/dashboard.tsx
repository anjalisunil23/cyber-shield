import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bell,
  Briefcase,
  CheckCircle2,
  Clock,
  FileStack,
  Timer,
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
  ChartCard,
  PageHeader,
  SkeletonGrid,
} from "@/components/layouts/DashboardWidgets";
import { StatsCard } from "@/components/layouts/StatsCard";
import { investigationApi } from "@/services/investigationApi";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/investigator/dashboard")({
  component: InvestigatorDashboard,
});

function InvestigatorDashboard() {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

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

  const chartGridStroke = isDark ? "#1f2937" : "#e2e8f0";
  const chartAxisStroke = "#64748b";
  const chartTooltipStyle = {
    backgroundColor: "var(--card)",
    borderColor: "var(--border)",
    borderRadius: "0.75rem",
    boxShadow: isDark
      ? "0 10px 15px -3px rgba(0, 0, 0, 0.5)"
      : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
    color: "var(--foreground)",
  };

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
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-200 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 animate-pulse" />
            <div>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Supervisor Review Action Required</p>
              <p className="text-xs text-amber-800/80 dark:text-amber-200/80">
                You have {changesRequestedCount} case{changesRequestedCount > 1 ? "s" : ""} where
                supervisor revisions have been requested.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void navigate({ to: "/investigator/cases" })}
            className="shrink-0 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-xs"
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
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                <XAxis dataKey="type" stroke={chartAxisStroke} fontSize={11} />
                <YAxis stroke={chartAxisStroke} fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} itemStyle={{ color: "var(--foreground)" }} />
                <Bar dataKey="count" fill={isDark ? "#06B6D4" : "#0284c7"} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Investigation Trajectory">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d?.monthly_cases || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                <XAxis dataKey="month" stroke={chartAxisStroke} fontSize={11} />
                <YAxis stroke={chartAxisStroke} fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} itemStyle={{ color: "var(--foreground)" }} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#2563EB"
                  fill={isDark ? "#3B82F633" : "#2563EB20"}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

