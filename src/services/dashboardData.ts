/** Mock dashboard datasets — swap for API calls via apiClient later. */

export type CaseStatus = "Open" | "Under Review" | "AI Processing" | "Completed" | "Closed";
export type Priority = "Low" | "Medium" | "High" | "Critical";

export type CaseRow = {
  id: string;
  title: string;
  priority: Priority;
  officer: string;
  status: CaseStatus;
  updated: string;
};

export type EvidenceItem = {
  id: string;
  name: string;
  type: "Image" | "Video" | "Document" | "Audio" | "Chat";
  date: string;
  aiStatus: "Pending" | "Processing" | "Analyzed" | "Failed";
  color: string;
};

export const STATS = [
  { key: "cases", label: "Total Cases", value: 128, delta: "+12%" },
  { key: "active", label: "Active Investigations", value: 34, delta: "+4" },
  { key: "evidence", label: "Evidence Files", value: 4280, delta: "+186" },
  { key: "pendingAi", label: "Pending AI Analysis", value: 27, delta: "-3" },
  { key: "reports", label: "Reports Generated", value: 91, delta: "+8" },
  { key: "online", label: "Team Members Online", value: 14, delta: "now" },
];

export const CASE_STATUS_PIE = [
  { name: "Open", value: 28, color: "#3B82F6" },
  { name: "Under Review", value: 22, color: "#06B6D4" },
  { name: "AI Processing", value: 18, color: "#F59E0B" },
  { name: "Completed", value: 40, color: "#22C55E" },
  { name: "Closed", value: 20, color: "#64748B" },
];

export const MONTHLY_INVESTIGATIONS = [
  { month: "Jan", cases: 18 },
  { month: "Feb", cases: 24 },
  { month: "Mar", cases: 21 },
  { month: "Apr", cases: 32 },
  { month: "May", cases: 28 },
  { month: "Jun", cases: 36 },
  { month: "Jul", cases: 41 },
];

export const EVIDENCE_UPLOADS = [
  { type: "Images", count: 420 },
  { type: "Videos", count: 180 },
  { type: "Docs", count: 260 },
  { type: "Audio", count: 95 },
  { type: "Chats", count: 310 },
];

export const AI_ACCURACY = [
  { week: "W1", accuracy: 92 },
  { week: "W2", accuracy: 94 },
  { week: "W3", accuracy: 93 },
  { week: "W4", accuracy: 96 },
  { week: "W5", accuracy: 97 },
  { week: "W6", accuracy: 98 },
];

export const RECENT_CASES: CaseRow[] = [
  {
    id: "CS-2048",
    title: "Cross-border messaging fraud",
    priority: "Critical",
    officer: "A. Mercer",
    status: "AI Processing",
    updated: "2h ago",
  },
  {
    id: "CS-2039",
    title: "Device seizure — financial records",
    priority: "High",
    officer: "P. Nair",
    status: "Under Review",
    updated: "5h ago",
  },
  {
    id: "CS-2031",
    title: "Social media harassment cluster",
    priority: "Medium",
    officer: "M. Hale",
    status: "Open",
    updated: "1d ago",
  },
  {
    id: "CS-2022",
    title: "Encrypted chat recovery",
    priority: "High",
    officer: "A. Rahman",
    status: "Completed",
    updated: "2d ago",
  },
  {
    id: "CS-2014",
    title: "CCTV timeline reconstruction",
    priority: "Low",
    officer: "J. Ortiz",
    status: "Closed",
    updated: "4d ago",
  },
];

export const EVIDENCE_ITEMS: EvidenceItem[] = [
  {
    id: "e1",
    name: "IMG_9912.png",
    type: "Image",
    date: "Today 09:14",
    aiStatus: "Analyzed",
    color: "#3B82F6",
  },
  {
    id: "e2",
    name: "whatsapp_dump.zip",
    type: "Chat",
    date: "Today 08:40",
    aiStatus: "Processing",
    color: "#06B6D4",
  },
  {
    id: "e3",
    name: "interview_audio.mp3",
    type: "Audio",
    date: "Yesterday",
    aiStatus: "Analyzed",
    color: "#22C55E",
  },
  {
    id: "e4",
    name: "ledger_scan.pdf",
    type: "Document",
    date: "Yesterday",
    aiStatus: "Pending",
    color: "#F59E0B",
  },
  {
    id: "e5",
    name: "cam_north.mp4",
    type: "Video",
    date: "Mon",
    aiStatus: "Analyzed",
    color: "#8B5CF6",
  },
  {
    id: "e6",
    name: "email_mbox.eml",
    type: "Document",
    date: "Mon",
    aiStatus: "Failed",
    color: "#EF4444",
  },
];

export const ACTIVITY = [
  { id: 1, text: "Evidence uploaded to CS-2048", time: "4m ago", tone: "cyan" },
  { id: 2, text: "Case CS-2039 assigned to P. Nair", time: "22m ago", tone: "blue" },
  { id: 3, text: "AI analysis completed on IMG_9912.png", time: "41m ago", tone: "green" },
  { id: 4, text: "Report generated for CS-2022", time: "2h ago", tone: "blue" },
  { id: 5, text: "Login detected — investigator session", time: "3h ago", tone: "slate" },
];

export const NOTIFICATIONS = [
  {
    id: 1,
    title: "New Evidence Uploaded",
    detail: "CS-2048 · whatsapp_dump.zip",
    time: "5m",
    level: "info",
  },
  {
    id: 2,
    title: "AI Analysis Completed",
    detail: "Face clusters ready for review",
    time: "28m",
    level: "success",
  },
  {
    id: 3,
    title: "High Risk Alert",
    detail: "Risk score 92 on CS-2048",
    time: "1h",
    level: "danger",
  },
  {
    id: 4,
    title: "Report Ready",
    detail: "CS-2022 draft awaiting approval",
    time: "3h",
    level: "info",
  },
  {
    id: 5,
    title: "System Update",
    detail: "OCR model v2.4 deployed",
    time: "1d",
    level: "warning",
  },
];

export const PRIORITY_QUEUE = [
  {
    name: "CS-2048 Messaging fraud",
    priority: "Critical",
    deadline: "Today",
    assignee: "A. Mercer",
    status: "AI Processing",
  },
  {
    name: "CS-2039 Financial seizure",
    priority: "High",
    deadline: "Tomorrow",
    assignee: "P. Nair",
    status: "Under Review",
  },
  {
    name: "CS-2031 Harassment cluster",
    priority: "Medium",
    deadline: "Fri",
    assignee: "M. Hale",
    status: "Open",
  },
];

export const TIMELINE_EVENTS = [
  {
    title: "Evidence Uploaded",
    detail: "12 files ingested into CS-2048",
    time: "09:12",
    tone: "cyan",
  },
  {
    title: "AI Analysis Completed",
    detail: "Entities + face clusters generated",
    time: "09:48",
    tone: "green",
  },
  {
    title: "Officer Notes",
    detail: "Requested deeper chat correlation",
    time: "10:15",
    tone: "blue",
  },
  { title: "Report Generated", detail: "Draft summary prepared", time: "11:02", tone: "amber" },
  {
    title: "Case Closed",
    detail: "CS-2014 archived after review",
    time: "Yesterday",
    tone: "slate",
  },
];

export const PROFILE = {
  name: "Alex Mercer",
  department: "Cyber Crime Unit",
  role: "Investigator",
  casesAssigned: 12,
  performance: 94,
};
