import { createFileRoute } from "@tanstack/react-router";
import {
  FolderPlus,
  NotebookPen,
  UploadCloud,
  Microscope,
  FileCheck2,
  Search,
  BellRing,
  FileText,
  UserCog,
  Briefcase,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import {
  ActionGrid,
  ActivityPanel,
  DashboardHeader,
  StatGrid,
} from "@/components/dashboard/DashboardKit";

export const Route = createFileRoute("/dashboard/investigator")({
  head: () => ({
    meta: [
      { title: "Investigator Dashboard — Cyber Shield" },
      {
        name: "description",
        content:
          "Manage cases, evidence metadata, forensic requests and AI-drafted reports as an investigator.",
      },
      { property: "og:title", content: "Investigator Dashboard — Cyber Shield" },
      {
        property: "og:description",
        content:
          "Cases, notes, evidence uploads, forensic requests and AI report review in one workspace.",
      },
    ],
  }),
  component: InvestigatorDashboard,
});

const STATS = [
  { label: "Active cases", value: "12", hint: "3 opened this week", Icon: Briefcase },
  { label: "Evidence items", value: "348", hint: "26 pending metadata review", Icon: UploadCloud },
  { label: "Forensic requests", value: "5", hint: "2 awaiting officer pickup", Icon: Microscope },
  { label: "Flagged leads", value: "7", hint: "High priority notifications", Icon: AlertTriangle },
];

const ACTIONS = [
  {
    title: "Create & manage cases",
    desc: "Open new cases, set classification and jurisdiction, and track status from intake to closure.",
    Icon: FolderPlus,
  },
  {
    title: "Case notes",
    desc: "Log structured fields alongside free-text observations, timestamped and attributed to you.",
    Icon: NotebookPen,
  },
  {
    title: "Upload evidence metadata",
    desc: "Register devices, exports and media with hashes, custody details and source references.",
    Icon: UploadCloud,
  },
  {
    title: "Request forensic analysis",
    desc: "Send an evidence item to a forensic officer with scope, priority and required turnaround.",
    Icon: Microscope,
  },
  {
    title: "View forensic reports",
    desc: "Access reports uploaded by forensic officers and link findings back to the case timeline.",
    Icon: FileText,
  },
  {
    title: "Review AI-drafted reports",
    desc: "Edit, annotate and finalize AI-assisted drafts — nothing is filed without your approval.",
    Icon: FileCheck2,
  },
  {
    title: "Search past cases & notes",
    desc: "Full-text and entity search across historical cases, notes and evidence records.",
    Icon: Search,
  },
  {
    title: "High-priority notifications",
    desc: "Get alerted the moment the correlation engine flags a lead above your threshold.",
    Icon: BellRing,
  },
  {
    title: "Secure profile",
    desc: "Manage credentials, MFA devices and session history for your investigator account.",
    Icon: UserCog,
  },
];

const ACTIVITY = [
  {
    primary: "CASE-2291 · Encrypted messaging ring",
    secondary: "AI draft ready for review — 4 correlated entities",
    tag: "Review",
  },
  {
    primary: "EVID-8842 · Mobile handset image",
    secondary: "Forensic analysis requested from Officer Rahman",
    tag: "Pending",
  },
  {
    primary: "CASE-2277 · Financial fraud chain",
    secondary: "New high-priority lead flagged (score 0.91)",
    tag: "Urgent",
  },
  {
    primary: "CASE-2260 · Device seizure log",
    secondary: "Forensic report uploaded and attached to timeline",
    tag: "New",
  },
];

function InvestigatorDashboard() {
  return (
    <>
      <DashboardHeader
        eyebrow="Investigator workspace"
        title="Your caseload at a glance"
        subtitle="Create cases, capture notes, register evidence, request forensic analysis and finalize AI-assisted reports — with every action written to the audit trail."
      />
      <StatGrid stats={STATS} />
      <ActionGrid
        title="Functionalities"
        description="Everything an investigator can do inside Cyber Shield."
        actions={ACTIONS}
      />
      <ActivityPanel title="Recent activity" items={ACTIVITY} />
      <section className="mt-12">
        <div className="glass-card flex flex-wrap items-center gap-4 p-6">
          <ClipboardList className="h-6 w-6 shrink-0 text-violet-glow" />
          <p className="min-w-0 flex-1 text-sm text-muted-foreground">
            AI output is advisory. Every generated section must be reviewed and approved before it
            enters a case file.
          </p>
        </div>
      </section>
    </>
  );
}
