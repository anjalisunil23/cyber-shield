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
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "under review":
      return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
    case "evidence collection":
      return "bg-violet-500/15 text-violet-400 border-violet-500/30";
    case "analysis":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    case "completed":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "archived":
    case "closed":
      return "bg-slate-500/15 text-slate-400 border-slate-500/30";
    default:
      return "bg-white/10 text-slate-300 border-white/10";
  }
}

export function priorityBadgeClass(priority: string) {
  switch (norm(priority)) {
    case "critical":
      return "bg-red-500/15 text-red-400 border-red-500/30";
    case "high":
      return "bg-orange-500/15 text-orange-400 border-orange-500/30";
    case "medium":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    default:
      return "bg-slate-500/15 text-slate-300 border-slate-500/30";
  }
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}
