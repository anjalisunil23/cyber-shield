import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Building2,
  CheckSquare,
  ClipboardList,
  Database,
  FileStack,
  FileText,
  FolderOpen,
  GitBranch,
  HardDrive,
  KeyRound,
  LayoutDashboard,
  MessageSquare,
  Network,
  NotebookPen,
  Settings,
  Shield,
  Timer,
  Upload,
  Users,
  UserCog,
} from "lucide-react";
import type { AppRole } from "@/lib/roles";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const supervisorNav: NavItem[] = [
  { to: "/superior/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/superior/cases", label: "Cases", icon: FolderOpen },
  { to: "/superior/messages", label: "Messages", icon: MessageSquare },
  { to: "/superior/evidence", label: "Evidence", icon: FileStack },
  { to: "/superior/timeline", label: "Timeline", icon: Timer },
  { to: "/superior/relationships", label: "Relationships", icon: Network },
  { to: "/superior/leads", label: "Manual Leads", icon: GitBranch },
  { to: "/superior/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/superior/reports", label: "Reports", icon: FileText },
  { to: "/superior/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/superior/investigators", label: "Investigators", icon: Users },
  { to: "/superior/settings", label: "Settings", icon: Settings },
];

export const ROLE_NAV: Record<AppRole, NavItem[]> = {
  major_admin: [
    { to: "/major-admin/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/major-admin/admins", label: "Admins", icon: Shield },
    { to: "/major-admin/departments", label: "Departments", icon: Building2 },
    { to: "/major-admin/users", label: "Users", icon: Users },
    { to: "/major-admin/cases", label: "Cases", icon: FolderOpen },
    { to: "/major-admin/reports", label: "Reports", icon: FileText },
    { to: "/major-admin/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/major-admin/roles", label: "Roles", icon: KeyRound },
    { to: "/major-admin/audit-logs", label: "Audit Logs", icon: Activity },
    { to: "/major-admin/storage", label: "Storage", icon: HardDrive },
    { to: "/major-admin/backup", label: "Backup", icon: Database },
    { to: "/major-admin/settings", label: "Settings", icon: Settings },
  ],
  admin: [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/superior-officers", label: "Superior Officers", icon: UserCog },
    { to: "/admin/investigators", label: "Investigators", icon: ClipboardList },
    { to: "/admin/cases", label: "Cases", icon: FolderOpen },
    { to: "/admin/assignments", label: "Assignments", icon: CheckSquare },
    { to: "/admin/evidence", label: "Evidence", icon: FileStack },
    { to: "/admin/reports", label: "Reports", icon: FileText },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/admin/settings", label: "Settings", icon: Settings },
  ],
  supervisor: supervisorNav,
  investigator: [
    { to: "/investigator/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/investigator/cases", label: "My Cases", icon: FolderOpen },
    { to: "/investigator/messages", label: "Messages", icon: MessageSquare },
    { to: "/investigator/upload", label: "Upload Evidence", icon: Upload },
    { to: "/investigator/evidence", label: "Evidence Repo", icon: FileStack },
    { to: "/investigator/timeline", label: "Timeline", icon: Timer },
    { to: "/investigator/notes", label: "Notes", icon: NotebookPen },
    { to: "/investigator/leads", label: "Manual Leads", icon: GitBranch },
    { to: "/investigator/tasks", label: "Tasks", icon: CheckSquare },
    { to: "/investigator/reports", label: "Reports", icon: FileText },
    { to: "/investigator/settings", label: "Settings", icon: Settings },
  ],
};
