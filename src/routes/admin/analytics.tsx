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

export const Route = createFileRoute("/admin/analytics")({ component: Page });

const COLORS = ["#3B82F6", "#F59E0B", "#10B981", "#06B6D4", "#EF4444"];

function Page() {
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

  return (
    <PageScaffold
      crumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Analytics" }]}
      title="Analytics"
      subtitle="Department performance"
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
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <ChartCard title="Priority distribution">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perf}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="d" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
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
