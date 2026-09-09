import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, CheckCircle2, ClipboardList, FileStack, UserPlus, Users } from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
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
import { investigationApi } from "@/services/investigationApi";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const stats = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => investigationApi.adminDashboard(),
  });

  if (stats.isLoading) return <SkeletonGrid count={6} />;
  const d = stats.data;

  const gridStroke = isDark ? "#1f2937" : "#e2e8f0";
  const axisStroke = isDark ? "#64748b" : "#94a3b8";
  const tooltipStyle = {
    backgroundColor: isDark ? "#0f172a" : "#ffffff",
    borderColor: isDark ? "#334155" : "#e2e8f0",
    color: isDark ? "#f8fafc" : "#0f172a",
    borderRadius: "8px",
    boxShadow: isDark ? "0 4px 6px -1px rgba(0, 0, 0, 0.5)" : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Organization / district investigation management"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatsCard
          label="Superior Officers"
          value={d?.superior_officers || 0}
          icon={Users}
          tone="cyan"
        />
        <StatsCard
          label="Investigators"
          value={d?.investigators || 0}
          icon={ClipboardList}
          tone="primary"
          delay={0.08}
        />
        <StatsCard
          label="Assigned Cases"
          value={d?.total_cases || 0}
          icon={Briefcase}
          delay={0.12}
        />
        <StatsCard
          label="Pending Cases"
          value={d?.open_cases || 0}
          icon={Briefcase}
          tone="amber"
          delay={0.16}
        />
        <StatsCard
          label="Completed Cases"
          value={d?.closed_cases || 0}
          icon={CheckCircle2}
          tone="emerald"
          delay={0.2}
        />
        <StatsCard
          label="Evidence Uploaded"
          value={d?.evidence_count || 0}
          icon={FileStack}
          tone="cyan"
          delay={0.24}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Case Status">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Active", value: d?.open_cases || 0 },
                    { name: "Completed", value: d?.closed_cases || 0 },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                >
                  <Cell fill="#3B82F6" />
                  <Cell fill="#10B981" />
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Evidence Types">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d?.evidence_types || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="type" stroke={axisStroke} fontSize={11} />
                <YAxis stroke={axisStroke} fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#06B6D4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Recent Activity">
          <ul className="space-y-2">
            {(d?.recent_activity || []).slice(0, 8).map((a) => (
              <li key={a.id} className="flex justify-between gap-2 text-sm">
                <span className="truncate text-foreground">{a.description}</span>
                <span className="shrink-0 text-xs text-cyan">{a.action}</span>
              </li>
            ))}
            {!d?.recent_activity?.length && (
              <li className="text-xs text-muted-foreground">No recent activity</li>
            )}
          </ul>
        </Panel>
        <Panel title="Recent Cases">
          <ul className="space-y-2">
            {(d?.recent_cases || []).map((c) => (
              <li key={c.id} className="text-sm text-foreground">
                {c.case_number} — {c.title}
              </li>
            ))}
            {!d?.recent_cases?.length && (
              <li className="text-xs text-muted-foreground">No cases yet</li>
            )}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QuickActionCard
          label="Create Investigator"
          description="Add an investigator account"
          icon={UserPlus}
          onClick={() => void navigate({ to: "/admin/users/create" })}
        />
        <QuickActionCard
          label="Create Superior Officer"
          description="Add a head of investigation"
          icon={Users}
          onClick={() => void navigate({ to: "/admin/users/create" })}
        />
        <QuickActionCard
          label="Assign Case"
          description="Open case management"
          icon={Briefcase}
          onClick={() => void navigate({ to: "/admin/cases" })}
        />
        <QuickActionCard
          label="Generate Report"
          description="Investigation summaries"
          icon={FileStack}
          onClick={() => void navigate({ to: "/admin/reports" })}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <AiPlaceholderCard
          title="Department AI Insights"
          blurb="Performance scoring arrives in Phase 2."
        />
        <AiPlaceholderCard title="AI Leads" blurb="Manual leads only for now." />
        <AiPlaceholderCard
          title="Object Detection Queue"
          blurb="Placeholder for YOLO-class modules."
        />
      </div>
    </div>
  );
}
