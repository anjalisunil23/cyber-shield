import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";
import { ChartCard, PageScaffold } from "@/components/ui-kit/PageKit";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/major-admin/analytics")({ component: Page });

const monthly = [
  { m: "Mar", c: 12 },
  { m: "Apr", c: 18 },
  { m: "May", c: 15 },
  { m: "Jun", c: 22 },
  { m: "Jul", c: 28 },
  { m: "Aug", c: 19 },
];
const growth = [
  { m: "Mar", u: 40 },
  { m: "Apr", u: 48 },
  { m: "May", u: 55 },
  { m: "Jun", u: 61 },
  { m: "Jul", u: 70 },
  { m: "Aug", u: 78 },
];
const radar = [
  { subject: "CCU", A: 120 },
  { subject: "DFL", A: 98 },
  { subject: "DHQ", A: 86 },
  { subject: "SOC", A: 65 },
];

function Page() {
  const { isDark } = useTheme();

  const gridStroke = isDark ? "#1f2937" : "#e2e8f0";
  const axisStroke = isDark ? "#64748b" : "#94a3b8";
  const polarGridStroke = isDark ? "#334155" : "#cbd5e1";
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
      crumbs={[{ label: "Major Admin", to: "/major-admin/dashboard" }, { label: "Analytics" }]}
      title="System Analytics"
      subtitle="Platform trends and metrics overview"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Monthly cases">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="m" stroke={axisStroke} fontSize={11} />
                <YAxis stroke={axisStroke} fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="c" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="User growth">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growth}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="m" stroke={axisStroke} fontSize={11} />
                <YAxis stroke={axisStroke} fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="u" stroke="#06B6D4" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Department load">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar}>
                <PolarGrid stroke={polarGridStroke} />
                <PolarAngleAxis dataKey="subject" stroke={axisStroke} fontSize={11} />
                <Radar dataKey="A" stroke="#3B82F6" fill="#3B82F644" />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </PageScaffold>
  );
}
