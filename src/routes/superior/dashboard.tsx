import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Clock,
  FileStack,
  FileText,
  Filter,
  Users,
  UserCheck,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { useState } from "react";
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

export const Route = createFileRoute("/superior/dashboard")({
  component: SuperiorDashboard,
});

const COLORS = ["#3B82F6", "#06B6D4", "#F59E0B", "#EF4444"];

function SuperiorDashboard() {
  const navigate = useNavigate();
  const [selectedInvestigator, setSelectedInvestigator] = useState<string>("all");

  const stats = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => investigationApi.dashboardStats(),
  });
  const cases = useQuery({
    queryKey: ["cases"],
    queryFn: () => investigationApi.listCases({ page_size: 50 }),
  });
  const users = useQuery({ queryKey: ["users"], queryFn: () => investigationApi.listUsers() });

  if (stats.isLoading) return <SkeletonGrid count={6} />;
  const d = stats.data;
  const allCases = cases.data?.items || [];
  const investigatorsList = (users.data?.items || []).filter((u) => u.role === "investigator");

  // Filter cases by selected investigator if specified
  const filteredCases =
    selectedInvestigator === "all"
      ? allCases
      : allCases.filter(
          (c) =>
            c.assignments?.some(
              (a) =>
                a.user_id === selectedInvestigator || a.user?.full_name === selectedInvestigator,
            ) || c.created_by_id === selectedInvestigator,
        );

  const totalSupervised = cases.data?.total || allCases.length;
  const awaitingReviewCount = allCases.filter((c) => c.status === "under_review").length;
  const changesRequestedCount = allCases.filter((c) => c.status === "changes_requested").length;
  const approvedCount = allCases.filter((c) =>
    ["approved", "completed", "closed", "archived"].includes(c.status),
  ).length;
  const highPriority = allCases.filter(
    (c) => c.priority === "high" || c.priority === "critical",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Superior Officer Oversight Dashboard"
          subtitle="Head of investigation — oversee team progress, review evidence, request revisions, and authorize approvals"
        />

        {/* Investigator Filter */}
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111827] px-3 py-2 shrink-0">
          <Filter className="h-4 w-4 text-cyan" />
          <span className="text-xs text-slate-400 font-medium">Investigator:</span>
          <select
            value={selectedInvestigator}
            onChange={(e) => setSelectedInvestigator(e.target.value)}
            className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-[#0f172a]">
              All Investigators ({investigatorsList.length})
            </option>
            {investigatorsList.map((inv) => (
              <option key={inv.id} value={inv.id} className="bg-[#0f172a]">
                {inv.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Review Alert Banner */}
      {awaitingReviewCount > 0 && (
        <div className="rounded-2xl border border-cyan/40 bg-cyan/10 p-4 text-cyan-200 flex items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-cyan shrink-0 animate-spin" />
            <div>
              <p className="text-sm font-bold text-cyan">Review Queue Pending</p>
              <p className="text-xs text-cyan-100/80">
                You have {awaitingReviewCount} case{awaitingReviewCount > 1 ? "s" : ""} submitted by
                investigators awaiting your review & sign-off.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void navigate({ to: "/superior/cases" })}
            className="shrink-0 rounded-xl bg-cyan px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan/90 transition-colors shadow-md"
          >
            Open Review Queue →
          </button>
        </div>
      )}

      {/* Dynamic Workflow Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Supervised Cases" value={totalSupervised} icon={Briefcase} />
        <StatsCard
          label="Awaiting Review"
          value={awaitingReviewCount}
          icon={Clock}
          tone="cyan"
          hint={awaitingReviewCount > 0 ? "Requires action" : "Queue empty"}
          delay={0.08}
        />
        <StatsCard
          label="Changes Requested"
          value={changesRequestedCount}
          icon={AlertTriangle}
          tone="amber"
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
          label="High Priority"
          value={highPriority}
          icon={AlertTriangle}
          tone="rose"
          delay={0.2}
        />
        <StatsCard
          label="Evidence Vault Items"
          value={d?.evidence_uploaded || 0}
          icon={FileStack}
          tone="cyan"
          delay={0.24}
        />
        <StatsCard
          label="Active Investigators"
          value={investigatorsList.length}
          icon={Users}
          tone="emerald"
          delay={0.28}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Investigation Trajectory & Closures">
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
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={`Supervised Cases (${filteredCases.length})`}>
          <ul className="space-y-2.5">
            {filteredCases.slice(0, 8).map((c) => {
              const isUnderReview = c.status === "under_review";
              return (
                <li
                  key={c.id}
                  className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition-all ${
                    isUnderReview
                      ? "border-cyan/40 bg-cyan/10"
                      : "border-white/5 bg-[#0b1220]/60 hover:border-white/20"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/superior/cases/$caseId"
                      params={{ caseId: c.id }}
                      className="text-sm font-semibold text-slate-200 hover:text-cyan hover:underline truncate block"
                    >
                      {c.case_number} · {c.title}
                    </Link>
                    <p className="text-xs text-slate-400 truncate">
                      Assigned:{" "}
                      {c.assignments
                        ?.map((a) => a.user?.full_name)
                        .filter(Boolean)
                        .join(", ") || "Unassigned"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge className={priorityBadgeClass(c.priority)}>
                      {formatLabel(c.priority)}
                    </Badge>
                    <Badge className={statusBadgeClass(c.status)}>{formatLabel(c.status)}</Badge>
                  </div>
                </li>
              );
            })}
            {!filteredCases.length && (
              <p className="text-sm text-slate-500 py-2">No cases found matching filter</p>
            )}
          </ul>
        </Panel>

        <Panel title="Latest Evidence Uploads">
          <ul className="space-y-2.5">
            {(d?.latest_uploads || []).map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-2 text-xs border-b border-white/5 pb-2"
              >
                <div className="truncate">
                  <span className="font-semibold text-slate-200 block truncate">
                    {e.original_name}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {e.sha256_hash?.substring(0, 16)}...
                  </span>
                </div>
                <span className="text-[10px] text-cyan shrink-0 uppercase bg-cyan/10 px-2 py-0.5 rounded">
                  {e.file_type}
                </span>
              </li>
            ))}
            {!d?.latest_uploads?.length && (
              <p className="text-sm text-slate-500 py-2">No uploads yet</p>
            )}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <QuickActionCard
          label="Create Case"
          description="Open a new investigation"
          icon={Briefcase}
          onClick={() => void navigate({ to: "/superior/cases" })}
        />
        <QuickActionCard
          label="Assign Investigator"
          description="Delegate case ownership"
          icon={Users}
          onClick={() => void navigate({ to: "/superior/investigators" })}
        />
        <QuickActionCard
          label="Review Evidence"
          description="Evidence review queue"
          icon={FileStack}
          onClick={() => void navigate({ to: "/superior/evidence" })}
        />
        <QuickActionCard
          label="Generate Report"
          description="Investigation summary"
          icon={FileText}
          onClick={() => void navigate({ to: "/superior/reports" })}
        />
        <QuickActionCard
          label="Close Case"
          description="Complete and archive"
          icon={CheckCircle2}
          onClick={() => void navigate({ to: "/superior/cases" })}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AiPlaceholderCard
          title="AI Suggestions"
          blurb="Review AI findings placeholder — Phase 2."
        />
        <AiPlaceholderCard title="Timeline Reconstruction" blurb="Automated timeline reserved." />
        <AiPlaceholderCard title="Face Detection" blurb="Will attach to evidence records later." />
        <AiPlaceholderCard title="Risk Assessment" blurb="Case risk score placeholder." />
      </div>
    </div>
  );
}
