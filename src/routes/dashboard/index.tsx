import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, CheckCircle2, FileStack, FileText, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Badge,
  formatLabel,
  priorityBadgeClass,
  statusBadgeClass,
} from "@/components/dashboard/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { apiMessage } from "@/services/apiClient";
import { investigationApi } from "@/services/investigationApi";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

const PIE_COLORS = ["#3B82F6", "#06B6D4", "#F59E0B", "#EF4444", "#10B981", "#8B5CF6"];

function DashboardHome() {
  const { isDark } = useTheme();
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => investigationApi.dashboardStats(),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading dashboard…</p>;
  if (error || !data)
    return <p className="text-sm text-destructive">{apiMessage(error, "Failed to load dashboard")}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Investigation Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Live caseload, evidence, and activity across CyberShield
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Active Cases" value={data.active_cases} delta="Live" icon={Briefcase} />
        <StatCard label="Completed" value={data.completed_cases} delta="Live" icon={CheckCircle2} />
        <StatCard label="Evidence" value={data.evidence_uploaded} delta="Live" icon={FileStack} />
        <StatCard label="Investigators" value={data.investigators} delta="Live" icon={Users} />
        <StatCard label="Reports" value={data.reports} delta="Live" icon={FileText} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Monthly Cases</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly_cases}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1f2937" : "#e2e8f0"} />
                <XAxis dataKey="month" stroke={isDark ? "#64748b" : "#94a3b8"} fontSize={11} />
                <YAxis stroke={isDark ? "#64748b" : "#94a3b8"} fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#0f172a" : "#ffffff",
                    borderColor: isDark ? "#334155" : "#e2e8f0",
                    color: isDark ? "#f8fafc" : "#0f172a",
                    borderRadius: "0.75rem",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Priority Distribution</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.priority_distribution}
                  dataKey="count"
                  nameKey="priority"
                  outerRadius={80}
                  label
                >
                  {data.priority_distribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#0f172a" : "#ffffff",
                    borderColor: isDark ? "#334155" : "#e2e8f0",
                    color: isDark ? "#f8fafc" : "#0f172a",
                    borderRadius: "0.75rem",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Recent Cases</h3>
            <Link to="/dashboard/cases" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <ul className="space-y-2">
            {data.recent_cases.map((c) => (
              <li key={c.id}>
                <Link
                  to="/dashboard/cases/$caseId"
                  params={{ caseId: c.id }}
                  className="flex items-center justify-between rounded-xl border border-border px-3 py-2 hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <p className="text-sm text-foreground font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.case_number}</p>
                  </div>
                  <div className="flex gap-1">
                    <Badge className={priorityBadgeClass(c.priority)}>
                      {formatLabel(c.priority)}
                    </Badge>
                    <Badge className={statusBadgeClass(c.status)}>{formatLabel(c.status)}</Badge>
                  </div>
                </Link>
              </li>
            ))}
            {!data.recent_cases.length && <p className="text-sm text-muted-foreground">No cases yet</p>}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Recent Activity</h3>
          <ul className="space-y-3">
            {data.recent_activity.map((a) => (
              <li key={a.id} className="border-l-2 border-primary/50 pl-3 py-0.5">
                <p className="text-sm text-foreground">{a.description}</p>
                <p className="text-xs text-muted-foreground">
                  {a.user?.full_name || "System"} · {new Date(a.created_at).toLocaleString()}
                </p>
              </li>
            ))}
            {!data.recent_activity.length && (
              <p className="text-sm text-muted-foreground">No activity yet</p>
            )}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Latest Evidence Uploads</h3>
        <ul className="divide-y divide-border">
          {data.latest_uploads.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-2 text-sm">
              <span className="truncate text-foreground font-medium">{e.original_name}</span>
              <span className="text-xs text-muted-foreground">
                {e.file_type} · {new Date(e.upload_date).toLocaleString()}
              </span>
            </li>
          ))}
          {!data.latest_uploads.length && <p className="text-sm text-muted-foreground">No uploads yet</p>}
        </ul>
      </div>
    </div>
  );
}
