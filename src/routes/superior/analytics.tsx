import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard, PageScaffold } from "@/components/ui-kit/PageKit";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/superior/analytics")({ component: Page });

const progress = [
  { m: "W1", v: 4 },
  { m: "W2", v: 7 },
  { m: "W3", v: 6 },
  { m: "W4", v: 9 },
];
const priority = [
  { name: "Critical", value: 2 },
  { name: "High", value: 5 },
  { name: "Medium", value: 8 },
  { name: "Low", value: 3 },
];
const COLORS = ["#EF4444", "#F59E0B", "#3B82F6", "#64748b"];

function Page() {
  const { isDark } = useTheme();

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
      crumbs={[
        { label: "Superior", to: "/superior/dashboard" },
        { label: "Investigation Analytics" },
      ]}
      title="Investigation Analytics"
      subtitle="Progress and priority overview"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Timeline activity">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progress}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="m" stroke={axisStroke} fontSize={11} />
                <YAxis stroke={axisStroke} fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="v" stroke="#06B6D4" fill="#06B6D433" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Priority distribution">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={priority} dataKey="value" nameKey="name" outerRadius={80}>
                  {priority.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </PageScaffold>
  );
}
