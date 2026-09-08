import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard, ErrorState, LoadingBlock, PageScaffold } from "@/components/ui-kit/PageKit";
import { apiMessage } from "@/services/apiClient";
import { investigationApi } from "@/services/investigationApi";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/admin/analytics")({ component: Page });

const COLORS = ["#3B82F6", "#F59E0B", "#10B981", "#06B6D4", "#EF4444"];

function Page() {
  const { isDark } = useTheme();
  const stats = useQuery({
    queryKey: ["admin-dashboard-analytics"],
    queryFn: () => investigationApi.adminDashboard(),
  });

  const status = [
    { name: "Open", value: stats.data?.open_cases || 0 },
    { name: "Closed", value: stats.data?.closed_cases || 0 },
  ];
  const perf = (stats.data?.priority_distribution || []).map((p) => ({
    d: p.priority,
    v: p.count,
  }));

  const gridStroke = isDark ? "#1f2937" : "#e2e8f0";
  const axisStroke = isDark ? "#64748b" : "#94a3b8";
  const tooltipStyle = {
    backgroundColor: isDark ? "#0f172a" : "#ffffff",
    borderColor: isDark ? "#334155" : "#e2e8f0",
    color: isDark ? "#f8fafc" : "#0f172a",
    borderRadius: "8px",
    boxShadow: isDark
      ? "0 4px 6px -1px rgba(0, 0, 0, 0.5)"
      : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  };

  return (
    <PageScaffold
      crumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Analytics" }]}
      title="Analytics"
      subtitle="Department performance overview"
    >
      {stats.isLoading && <LoadingBlock />}
      {stats.isError && <ErrorState message={apiMessage(stats.error)} />}
      {!stats.isLoading && !stats.isError && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Case status">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={status} dataKey="value" nameKey="name" outerRadius={80}>
                    {status.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <ChartCard title="Priority distribution">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perf}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="d" stroke={axisStroke} fontSize={11} />
                  <YAxis stroke={axisStroke} fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="v" fill="#06B6D4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      )}
    </PageScaffold>
  );
}
