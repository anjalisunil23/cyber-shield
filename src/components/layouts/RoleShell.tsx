import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, LogOut, Shield } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { RoleTopNavbar } from "@/components/layouts/RoleTopNavbar";
import { ROLE_NAV } from "@/config/roleNav";
import { clearToken, getToken, isAuthenticated } from "@/lib/auth";
import {
  homeForRole,
  ROLE_LABEL,
  roleFromAccessToken,
  normalizeRole,
  type AppRole,
} from "@/lib/roles";
import { cn } from "@/lib/utils";

export function RoleShell({ role, breadcrumbs }: { role: AppRole; breadcrumbs?: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [ready, setReady] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = ROLE_NAV[role];

  useEffect(() => {
    if (!isAuthenticated()) {
      void navigate({ to: "/login" });
      return;
    }
    const tokenRole = normalizeRole(roleFromAccessToken(getToken()));
    const componentRole = normalizeRole(role);
    if (tokenRole !== componentRole) {
      window.location.assign(homeForRole(tokenRole));
      return;
    }
    setReady(true);
  }, [navigate, role]);

  function logout() {
    clearToken();
    void navigate({ to: "/login" });
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] text-slate-400">
        Verifying role access…
      </div>
    );
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-4">
        <Link to={ROLE_NAV[role][0].to as "/"} className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-cyan">
            <Shield className="h-5 w-5 text-white" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-50">
                Cyber<span className="text-cyan">Shield</span>
              </p>
              <p className="truncate text-[10px] text-slate-500">{ROLE_LABEL[role]}</p>
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="hidden h-8 w-8 place-items-center rounded-lg border border-white/10 text-slate-400 hover:text-white lg:grid"
          aria-label="Collapse sidebar"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {nav.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to as "/"}
              onClick={() => setMobileOpen(false)}
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
    <div className="min-h-screen bg-[#020617] text-slate-100">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-white/10 bg-[#020617]/95 backdrop-blur-xl transition-[width] duration-300 lg:block",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            className="relative h-full w-72 border-r border-white/10 bg-[#020617]"
          >
            {sidebar}
          </motion.aside>
        </div>
      )}

      <div
        className={cn("transition-[padding] duration-300", collapsed ? "lg:pl-[76px]" : "lg:pl-64")}
      >
        <RoleTopNavbar onMenu={() => setMobileOpen(true)} role={role} />
        {breadcrumbs && (
          <div className="border-b border-white/5 px-4 py-2 text-xs text-slate-500 sm:px-6">
            {breadcrumbs}
          </div>
        )}
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="px-4 py-6 sm:px-6"
        >
          <Outlet />
        </motion.main>
      </div>
      <Toaster theme="dark" position="top-right" richColors />
    </div>
  );
}
