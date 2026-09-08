import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function norm(value: string) {
  return value.toLowerCase().replace(/_/g, " ");
}

export function formatLabel(value: string) {
  return value
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function statusBadgeClass(status: string) {
  switch (norm(status)) {
    case "open":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30";
    case "under review":
      return "bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-500/30";
    case "evidence collection":
      return "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-400 dark:border-violet-500/30";
    case "analysis":
      return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30";
    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30";
    case "archived":
    case "closed":
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/30";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/10 dark:text-slate-300 dark:border-white/10";
  }
}

export function priorityBadgeClass(priority: string) {
  switch (norm(priority)) {
    case "critical":
      return "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30";
    case "high":
      return "bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/30";
    case "medium":
      return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30";
  }
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide transition-colors",
        className,
      )}
    >
      {children}
    </span>
  );
}
