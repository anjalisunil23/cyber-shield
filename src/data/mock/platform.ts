/** Mock JSON for CyberShield UI pages (no backend). */

export type MockUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "Active" | "Suspended";
  lastLogin: string;
  phone?: string;
};

export type MockCase = {
  id: string;
  caseNumber: string;
  title: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: string;
  assignee: string;
  department: string;
  updated: string;
  created: string;
  description: string;
};

export type MockEvidence = {
  id: string;
  name: string;
  type: "image" | "video" | "audio" | "pdf" | "document" | "other";
  size: string;
  caseNumber: string;
  uploadedBy: string;
  uploadedAt: string;
  tags: string[];
  sha256: string;
};

export type MockNote = {
  id: string;
  title: string;
  body: string;
  caseNumber: string;
  author: string;
  pinned: boolean;
  updatedAt: string;
};

export type MockLead = {
  id: string;
  title: string;
  priority: string;
  status: string;
  caseNumber: string;
  assignee: string;
};

export type MockTask = {
  id: string;
  title: string;
  due: string;
  status: "Open" | "In Progress" | "Done";
  caseNumber: string;
};

export type MockNotification = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: string;
};

export type MockAudit = {
  id: string;
  action: string;
  actor: string;
  resource: string;
  time: string;
  ip: string;
};

export const MOCK_USERS: MockUser[] = [
  {
    id: "u1",
    name: "Priya Nair",
    email: "priya.nair@agency.gov",
    role: "Admin",
    department: "District HQ",
    status: "Active",
    lastLogin: "2026-08-03 09:12",
    phone: "+91 98765 11101",
  },
  {
    id: "u2",
    name: "Ravi Menon",
    email: "ravi.menon@agency.gov",
    role: "Superior Officer",
    department: "Cyber Crime Unit",
    status: "Active",
    lastLogin: "2026-08-03 08:40",
    phone: "+91 98765 11102",
  },
  {
    id: "u3",
    name: "Alex Mercer",
    email: "alex.mercer@agency.gov",
    role: "Investigator",
    department: "Cyber Crime Unit",
    status: "Active",
    lastLogin: "2026-08-02 18:22",
    phone: "+91 98765 11103",
  },
  {
    id: "u4",
    name: "Sana Joseph",
    email: "sana.joseph@agency.gov",
    role: "Investigator",
    department: "Digital Forensics Lab",
    status: "Active",
    lastLogin: "2026-08-02 16:05",
  },
  {
    id: "u5",
    name: "Imran Khan",
    email: "imran.khan@agency.gov",
    role: "Admin",
    department: "District HQ",
    status: "Suspended",
    lastLogin: "2026-07-20 11:00",
  },
  {
    id: "u6",
    name: "Major Admin",
    email: "major@cybershield.gov",
    role: "Major Admin",
    department: "Platform HQ",
    status: "Active",
    lastLogin: "2026-08-03 10:01",
  },
];

export const MOCK_DEPARTMENTS = [
  {
    id: "d1",
    name: "Cyber Crime Unit",
    code: "CCU",
    officers: 24,
    cases: 58,
    status: "Active",
    description: "Primary cyber offence investigations.",
  },
  {
    id: "d2",
    name: "Digital Forensics Lab",
    code: "DFL",
    officers: 12,
    cases: 31,
    status: "Active",
    description: "Evidence acquisition and analysis.",
  },
  {
    id: "d3",
    name: "District HQ",
    code: "DHQ",
    officers: 8,
    cases: 17,
    status: "Active",
    description: "Administrative oversight unit.",
  },
  {
    id: "d4",
    name: "Special Ops Cell",
    code: "SOC",
    officers: 6,
    cases: 9,
    status: "Inactive",
    description: "Cross-border digital crime cell.",
  },
];

export const MOCK_CASES: MockCase[] = [
  {
    id: "c1",
    caseNumber: "CS-2026-0142",
    title: "Phishing campaign — banking sector",
    priority: "Critical",
    status: "Under Review",
    assignee: "Alex Mercer",
    department: "CCU",
    updated: "2026-08-03",
    created: "2026-07-12",
    description: "Large-scale credential harvesting targeting retail banking customers.",
  },
  {
    id: "c2",
    caseNumber: "CS-2026-0138",
    title: "Ransomware endpoint triage",
    priority: "High",
    status: "Evidence Collection",
    assignee: "Sana Joseph",
    department: "DFL",
    updated: "2026-08-02",
    created: "2026-07-08",
    description: "Encrypted workstations recovered from a municipal office.",
  },
  {
    id: "c3",
    caseNumber: "CS-2026-0121",
    title: "Social media impersonation",
    priority: "Medium",
    status: "Analysis",
    assignee: "Alex Mercer",
    department: "CCU",
    updated: "2026-08-01",
    created: "2026-06-22",
    description: "Fake VIP profiles used for investment fraud.",
  },
  {
    id: "c4",
    caseNumber: "CS-2026-0110",
    title: "Dark web marketplace listing",
    priority: "High",
    status: "Open",
    assignee: "Unassigned",
    department: "CCU",
    updated: "2026-07-30",
    created: "2026-06-15",
    description: "Suspected sale of PII dumps linked to Kerala residents.",
  },
  {
    id: "c5",
    caseNumber: "CS-2026-0094",
    title: "SIM swap fraud cluster",
    priority: "Low",
    status: "Completed",
    assignee: "Sana Joseph",
    department: "DHQ",
    updated: "2026-07-18",
    created: "2026-05-02",
    description: "Closed after carrier cooperation and device seizure.",
  },
];

export const MOCK_EVIDENCE: MockEvidence[] = [
  {
    id: "e1",
    name: "phishing_landing.png",
    type: "image",
    size: "1.2 MB",
    caseNumber: "CS-2026-0142",
    uploadedBy: "Alex Mercer",
    uploadedAt: "2026-08-01 14:22",
    tags: ["screenshot", "web"],
    sha256: "a3f1…9c2e",
  },
  {
    id: "e2",
    name: "cctv_lobby.mp4",
    type: "video",
    size: "84 MB",
    caseNumber: "CS-2026-0138",
    uploadedBy: "Sana Joseph",
    uploadedAt: "2026-07-29 11:05",
    tags: ["cctv"],
    sha256: "bb12…44aa",
  },
  {
    id: "e3",
    name: "call_recording.wav",
    type: "audio",
    size: "6.4 MB",
    caseNumber: "CS-2026-0121",
    uploadedBy: "Alex Mercer",
    uploadedAt: "2026-07-28 09:40",
    tags: ["audio", "voip"],
    sha256: "c901…77ff",
  },
  {
    id: "e4",
    name: "forensic_report.pdf",
    type: "pdf",
    size: "2.1 MB",
    caseNumber: "CS-2026-0138",
    uploadedBy: "Ravi Menon",
    uploadedAt: "2026-07-27 16:18",
    tags: ["report"],
    sha256: "d4e0…12ab",
  },
  {
    id: "e5",
    name: "chat_export.json",
    type: "document",
    size: "420 KB",
    caseNumber: "CS-2026-0142",
    uploadedBy: "Alex Mercer",
    uploadedAt: "2026-07-26 13:02",
    tags: ["chat", "export"],
    sha256: "e881…90cd",
  },
  {
    id: "e6",
    name: "disk_image_notes.docx",
    type: "document",
    size: "890 KB",
    caseNumber: "CS-2026-0110",
    uploadedBy: "Sana Joseph",
    uploadedAt: "2026-07-25 10:11",
    tags: ["notes"],
    sha256: "f012…55ee",
  },
];

export const MOCK_NOTES: MockNote[] = [
  {
    id: "n1",
    title: "Initial triage",
    body: "Landing page mirrors legitimate bank portal. SSL cert mismatched.",
    caseNumber: "CS-2026-0142",
    author: "Alex Mercer",
    pinned: true,
    updatedAt: "2026-08-01",
  },
  {
    id: "n2",
    title: "Witness statement",
    body: "Complainant received SMS with shortened URL at 21:14 IST.",
    caseNumber: "CS-2026-0142",
    author: "Alex Mercer",
    pinned: false,
    updatedAt: "2026-07-31",
  },
  {
    id: "n3",
    title: "Lab intake",
    body: "Two laptops imaged; write-blockers verified.",
    caseNumber: "CS-2026-0138",
    author: "Sana Joseph",
    pinned: true,
    updatedAt: "2026-07-29",
  },
];

export const MOCK_LEADS: MockLead[] = [
  {
    id: "l1",
    title: "Hosting provider abuse contact",
    priority: "High",
    status: "Open",
    caseNumber: "CS-2026-0142",
    assignee: "Alex Mercer",
  },
  {
    id: "l2",
    title: "Wallet cluster on exchange",
    priority: "Critical",
    status: "In Progress",
    caseNumber: "CS-2026-0138",
    assignee: "Sana Joseph",
  },
  {
    id: "l3",
    title: "Secondary phone number",
    priority: "Medium",
    status: "Closed",
    caseNumber: "CS-2026-0121",
    assignee: "Alex Mercer",
  },
];

export const MOCK_TASKS: MockTask[] = [
  {
    id: "t1",
    title: "Request CDN logs",
    due: "2026-08-05",
    status: "Open",
    caseNumber: "CS-2026-0142",
  },
  {
    id: "t2",
    title: "Hash-verify disk images",
    due: "2026-08-04",
    status: "In Progress",
    caseNumber: "CS-2026-0138",
  },
  {
    id: "t3",
    title: "Draft interim report",
    due: "2026-08-06",
    status: "Open",
    caseNumber: "CS-2026-0121",
  },
  {
    id: "t4",
    title: "Close complainant loop",
    due: "2026-07-20",
    status: "Done",
    caseNumber: "CS-2026-0094",
  },
];

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: "nt1",
    title: "Case assigned",
    message: "You were assigned CS-2026-0142",
    time: "12 min ago",
    read: false,
    type: "case",
  },
  {
    id: "nt2",
    title: "Evidence uploaded",
    message: "phishing_landing.png added to CS-2026-0142",
    time: "1 hr ago",
    read: false,
    type: "evidence",
  },
  {
    id: "nt3",
    title: "Status changed",
    message: "CS-2026-0138 moved to Evidence Collection",
    time: "3 hr ago",
    read: true,
    type: "status",
  },
  {
    id: "nt4",
    title: "New note",
    message: "Sana Joseph pinned a note on CS-2026-0138",
    time: "Yesterday",
    read: true,
    type: "note",
  },
];

export const MOCK_AUDIT: MockAudit[] = [
  {
    id: "a1",
    action: "LOGIN",
    actor: "major@cybershield.gov",
    resource: "Auth",
    time: "2026-08-03 10:01",
    ip: "10.0.0.12",
  },
  {
    id: "a2",
    action: "CREATE",
    actor: "admin@example.com",
    resource: "User: sana.joseph",
    time: "2026-08-02 15:44",
    ip: "10.0.0.21",
  },
  {
    id: "a3",
    action: "DOWNLOAD",
    actor: "alex.mercer@agency.gov",
    resource: "Evidence e4",
    time: "2026-08-02 12:10",
    ip: "10.0.1.8",
  },
  {
    id: "a4",
    action: "UPDATE",
    actor: "ravi.menon@agency.gov",
    resource: "Case CS-2026-0138",
    time: "2026-08-01 17:33",
    ip: "10.0.1.4",
  },
  {
    id: "a5",
    action: "DELETE",
    actor: "admin@example.com",
    resource: "Draft report R-882",
    time: "2026-07-30 09:18",
    ip: "10.0.0.21",
  },
];

export const MOCK_TIMELINE = [
  {
    id: "tl1",
    title: "Case created",
    detail: "CS-2026-0142 opened by Ravi Menon",
    at: "2026-07-12 09:00",
    type: "case",
  },
  {
    id: "tl2",
    title: "Investigator assigned",
    detail: "Alex Mercer assigned as primary",
    at: "2026-07-12 09:40",
    type: "assign",
  },
  {
    id: "tl3",
    title: "Evidence uploaded",
    detail: "phishing_landing.png",
    at: "2026-08-01 14:22",
    type: "evidence",
  },
  {
    id: "tl4",
    title: "Note added",
    detail: "Initial triage",
    at: "2026-08-01 15:01",
    type: "note",
  },
  {
    id: "tl5",
    title: "Status updated",
    detail: "Open → Under Review",
    at: "2026-08-02 10:20",
    type: "status",
  },
];

export const MOCK_RELATIONSHIPS = [
  {
    id: "r1",
    source: "phishing_landing.png",
    target: "Suspect Domain",
    type: "Evidence → Location",
  },
  {
    id: "r2",
    source: "chat_export.json",
    target: "Unknown Handle @coinx",
    type: "Evidence → Person",
  },
  { id: "r3", source: "Laptop-A", target: "USB-0091", type: "Device → Device" },
  { id: "r4", source: "Alex Mercer", target: "CS-2026-0142", type: "Person → Case" },
];

export const MOCK_REPORTS = [
  {
    id: "rp1",
    title: "Interim Investigation Summary — CS-2026-0142",
    format: "PDF",
    author: "Alex Mercer",
    created: "2026-08-02",
  },
  {
    id: "rp2",
    title: "Forensic Intake — CS-2026-0138",
    format: "HTML",
    author: "Sana Joseph",
    created: "2026-07-29",
  },
  {
    id: "rp3",
    title: "Closure Pack — CS-2026-0094",
    format: "CSV",
    author: "Ravi Menon",
    created: "2026-07-18",
  },
];

export const MOCK_STORAGE = [
  { name: "Evidence vault", used: 68, total: "12 TB" },
  { name: "Report archive", used: 34, total: "2 TB" },
  { name: "Backup volume", used: 51, total: "8 TB" },
];
