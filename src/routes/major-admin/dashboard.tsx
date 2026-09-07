import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Briefcase,
  Building2,
  CheckCircle2,
  FileStack,
  HardDrive,
  Shield,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
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
  AiPlaceholderCard,
  ChartCard,
  PageHeader,
  Panel,
  QuickActionCard,
  SkeletonGrid,
} from "@/components/layouts/DashboardWidgets";
import { StatsCard } from "@/components/layouts/StatsCard";
import { investigationApi } from "@/services/investigationApi";

export const Route = createFileRoute("/major-admin/dashboard")({
  component: MajorAdminDashboard,
});

const COLORS = ["#3B82F6", "#06B6D4", "#F59E0B", "#EF4444", "#10B981", "#8B5CF6"];

function MajorAdminDashboard() {
  const navigate = useNavigate();
  const stats = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => investigationApi.dashboardStats(),
  });
  const users = useQuery({ queryKey: ["users"], queryFn: () => investigationApi.listUsers() });
  const activity = useQuery({
    queryKey: ["activity"],
    queryFn: () => investigationApi.activity(1),
  });

  if (stats.isLoading) return <SkeletonGrid count={8} />;
  const d = stats.data;
  const items = users.data?.items || [];
  const admins = items.filter((u) => u.role === "admin").length;
  const superiors = items.filter((u) => u.role === "superior_officer").length;
  const investigators = items.filter((u) => u.role === "investigator").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Major Admin Control Center"
        subtitle="Platform-wide oversight for CyberShield investigation operations"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Total Admins" value={admins} icon={Shield} tone="primary" delay={0.05} />
        <StatsCard
          label="Superior Officers"
          value={superiors}
          icon={Users}
          tone="cyan"
          delay={0.1}
        />
        <StatsCard
          label="Investigators"
          value={investigators}
          icon={Users}
          tone="emerald"
          delay={0.15}
        />
        <StatsCard
          label="Total Cases"
          value={(d?.active_cases || 0) + (d?.completed_cases || 0)}
          icon={Briefcase}
          delay={0.2}
        />
        <StatsCard
          label="Active Cases"
          value={d?.active_cases || 0}
          icon={Activity}
          tone="amber"
          delay={0.25}
        />
        <StatsCard
          label="Closed Cases"
          value={d?.completed_cases || 0}
          icon={CheckCircle2}
          tone="emerald"
          delay={0.3}
        />
        <StatsCard
          label="Evidence Uploaded"
          value={d?.evidence_uploaded || 0}
          icon={FileStack}
          tone="cyan"
          delay={0.35}
        />
        <StatsCard
          label="Storage Usage"
          value={68}
          hint="Placeholder %"
          icon={HardDrive}
          tone="rose"
          delay={0.4}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Monthly Case Analytics">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d?.monthly_cases || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
                <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Priority Distribution">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={d?.priority_distribution || []}
                  dataKey="count"
                  nameKey="priority"
                  outerRadius={80}
                >
                  {(d?.priority_distribution || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Evidence Upload Trends">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d?.evidence_types || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="type" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
                <Area type="monotone" dataKey="count" stroke="#06B6D4" fill="#06B6D433" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="System Health">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["API", "Operational"],
              ["Database", "Healthy"],
              ["Storage", "68% used"],
              ["AI Queue", "Phase 2"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                <p className="text-xs text-slate-500">{k}</p>
                <p className="text-sm font-medium text-emerald-400">{v}</p>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Recent Users" className="lg:col-span-1">
          <ul className="space-y-2">
            {items.slice(0, 6).map((u) => (
              <li key={u.id} className="flex justify-between text-sm">
                <span className="text-slate-200">{u.full_name}</span>
                <span className="text-xs text-cyan">{u.role}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Recent Cases" className="lg:col-span-1">
          <ul className="space-y-2">
            {(d?.recent_cases || []).map((c) => (
              <li key={c.id} className="text-sm">
                <p className="text-slate-200">{c.title}</p>
                <p className="text-xs text-slate-500">{c.case_number}</p>
              </li>
            ))}
            {!d?.recent_cases?.length && <p className="text-sm text-slate-500">No cases yet</p>}
          </ul>
        </Panel>
        <Panel title="Audit Logs" className="lg:col-span-1">
          <ul className="space-y-2">
            {(activity.data?.items || []).slice(0, 6).map((a) => (
              <li key={a.id} className="text-sm text-slate-300">
                <span className="text-cyan">{a.action}</span> — {a.description}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <QuickActionCard
          label="Create Admin"
          description="Provision a new Admin account"
          icon={Shield}
          onClick={() => void navigate({ to: "/major-admin/admins" })}
        />
        <QuickActionCard
          label="Departments"
          description="Manage investigation units"
          icon={Building2}
          onClick={() => void navigate({ to: "/major-admin/departments" })}
        />
        <QuickActionCard
          label="View Reports"
          description="Platform report library"
          icon={FileStack}
          onClick={() => void navigate({ to: "/major-admin/reports" })}
        />
        <QuickActionCard
          label="Audit Logs"
          description="Security activity trail"
          icon={Activity}
          onClick={() => void navigate({ to: "/major-admin/audit-logs" })}
        />
        <QuickActionCard
          label="System Settings"
          description="Configuration & backups"
          icon={HardDrive}
          onClick={() => void navigate({ to: "/major-admin/settings" })}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AiPlaceholderCard
          title="AI Evidence Analysis"
          blurb="Queue depth and model status arrive in Phase 2."
        />
        <AiPlaceholderCard
          title="Knowledge Graph"
          blurb="Global entity graph reserved for AI linking."
        />
        <AiPlaceholderCard title="Risk Assessment" blurb="Platform risk scoring placeholder." />
        <AiPlaceholderCard
          title="OCR / Speech / Faces"
          blurb="Extraction pipelines will plug into evidence fields."
        />
      </div>
    </div>
  );
}
