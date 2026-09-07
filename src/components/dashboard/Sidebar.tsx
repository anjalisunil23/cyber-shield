import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderOpen,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Network,
  Settings,
  Shield,
  Timer,
  Users,
} from "lucide-react";
import { clearToken } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/cases", label: "Cases", icon: FolderOpen },
  { to: "/dashboard/evidence", label: "Evidence", icon: FileText },
  { to: "/dashboard/timeline", label: "Timeline", icon: Timer },
  { to: "/dashboard/graph", label: "Relationships", icon: Network },
  { to: "/dashboard/reports", label: "Reports", icon: GitBranch },
  { to: "/dashboard/team", label: "Investigators", icon: Users },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { to: "/dashboard/ai-analysis", label: "AI (Phase 2)", icon: BrainCircuit },
  { to: "/dashboard/admin", label: "Admin", icon: Shield },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  function logout() {
    clearToken();
    void navigate({ to: "/login" });
  }

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-4">
        <Link to="/dashboard" className="flex min-w-0 items-center gap-2" onClick={onCloseMobile}>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-cyan">
            <Shield className="h-5 w-5 text-white" />
          </span>
          {!collapsed && (
            <span className="truncate text-sm font-bold tracking-tight text-slate-50">
              Cyber<span className="text-cyan">Shield</span>
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={onToggle}
          className="hidden h-8 w-8 place-items-center rounded-lg border border-white/10 text-slate-400 hover:text-white lg:grid"
          aria-label="Collapse sidebar"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                active
                  ? "bg-primary/15 text-primary shadow-[0_0_24px_-12px_rgba(59,130,246,0.8)]"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
                collapsed && "justify-center px-2",
              )}
              title={item.label}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-2">
        <button
          type="button"
          onClick={logout}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-red-500/10 hover:text-red-400",
            collapsed && "justify-center px-2",
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "Logout"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-white/10 bg-[#0F172A] transition-[width] duration-300 lg:block",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        {content}
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/60 transition",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={onCloseMobile}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-72 border-r border-white/10 bg-[#0F172A] transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {content}
        </aside>
      </div>
    </>
  );
}
