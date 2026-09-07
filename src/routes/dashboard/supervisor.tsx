import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  GaugeCircle,
  Microscope,
  MessageSquare,
  Flag,
  BarChart3,
  Users,
  Sparkles,
  ClipboardCheck,
  TrendingUp,
  Clock,
} from "lucide-react";
import {
  ActionGrid,
  ActivityPanel,
  DashboardHeader,
  StatGrid,
} from "@/components/dashboard/DashboardKit";

export const Route = createFileRoute("/dashboard/supervisor")({
  head: () => ({
    meta: [
      { title: "Supervisor Dashboard — Cyber Shield" },
      {
        name: "description",
        content:
          "Approve case reports, monitor investigator caseloads and forensic workload, and assign forensic resources.",
      },
      { property: "og:title", content: "Supervisor Dashboard — Cyber Shield" },
      {
        property: "og:description",
        content:
          "Oversight for report approvals, team workload, AI feedback and forensic resourcing.",
      },
    ],
  }),
  component: SupervisorDashboard,
});

const STATS = [
  {
    label: "Awaiting approval",
    value: "9",
    hint: "3 past target turnaround",
    Icon: ClipboardCheck,
  },
  { label: "Team caseload", value: "64", hint: "Across 11 investigators", Icon: Users },
  { label: "Forensic queue", value: "18", hint: "Avg. 2.4 days per item", Icon: Microscope },
  { label: "AI corrections", value: "23", hint: "Flagged this month", Icon: Flag },
];

const ACTIONS = [
  {
    title: "Approve case reports",
    desc: "Review and sign off on reports before a case can be moved to closure.",
    Icon: CheckCircle2,
  },
  {
    title: "Monitor caseloads",
    desc: "Track investigator workload, case progress and ageing across the whole team.",
    Icon: GaugeCircle,
  },
  {
    title: "Monitor forensic workload",
    desc: "See forensic analysis progress, backlog and turnaround per officer.",
    Icon: Microscope,
  },
  {
    title: "Feedback on AI summaries",
    desc: "Rate and comment on AI-generated summaries to steer future drafting quality.",
    Icon: Sparkles,
  },
  {
    title: "Flag corrections for the model",
    desc: "Mark incorrect correlations or scores so the model is retrained on verified outcomes.",
    Icon: Flag,
  },
  {
    title: "Case-level messaging",
    desc: "Communicate with investigators in the context of a specific case thread.",
    Icon: MessageSquare,
  },
  {
    title: "Performance reports",
    desc: "Generate team performance and case status reports for command review.",
    Icon: BarChart3,
  },
  {
    title: "Assign forensic resources",
    desc: "Direct forensic officers to priority cases and rebalance the queue.",
    Icon: Users,
  },
  {
    title: "Turnaround tracking",
    desc: "Watch SLA clocks on approvals, analysis and closure milestones.",
    Icon: Clock,
  },
];

const ACTIVITY = [
  {
    primary: "CASE-2291 · Report submitted by A. Mercer",
    secondary: "Awaiting supervisor approval — 2 AI sections edited",
    tag: "Approve",
  },
  {
    primary: "Officer Rahman · Forensic queue",
    secondary: "6 items assigned, 2 overdue against target",
    tag: "Overdue",
  },
  {
    primary: "AI summary feedback",
    secondary: "3 corrections flagged on entity resolution",
    tag: "Feedback",
  },
  {
    primary: "Weekly team report",
    secondary: "Case closure rate up 12% week over week",
    tag: "Report",
  },
];

function SupervisorDashboard() {
  return (
    <>
      <DashboardHeader
        eyebrow="Supervisor oversight"
        title="Team, quality and forensic capacity"
        subtitle="Approve reports before closure, keep caseloads balanced, direct forensic resources and correct the AI where it gets things wrong."
      />
      <StatGrid stats={STATS} />
      <ActionGrid
        title="Functionalities"
        description="Everything a supervisor can do inside Cyber Shield."
        actions={ACTIONS}
      />
      <ActivityPanel title="Needs your attention" items={ACTIVITY} />
      <section className="mt-12">
        <div className="glass-card flex flex-wrap items-center gap-4 p-6">
          <TrendingUp className="h-6 w-6 shrink-0 text-violet-glow" />
          <p className="min-w-0 flex-1 text-sm text-muted-foreground">
            Approval decisions and AI corrections are logged with your identity and feed the model
            quality dashboard.
          </p>
        </div>
      </section>
    </>
  );
}
