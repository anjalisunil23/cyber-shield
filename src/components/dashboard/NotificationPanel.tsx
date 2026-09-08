import { NOTIFICATIONS } from "@/services/dashboardData";
import { cn } from "@/lib/utils";

export function NotificationPanel() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
      <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
      <ul className="mt-4 space-y-3">
        {NOTIFICATIONS.map((n) => (
          <li key={n.id} className="rounded-xl border border-border/60 bg-muted/40 p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{n.title}</p>
              <span className="text-[10px] text-muted-foreground">{n.time}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{n.detail}</p>
            <span
              className={cn(
                "mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
                n.level === "danger" && "bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30",
                n.level === "success" && "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
                n.level === "warning" && "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
                n.level === "info" && "bg-cyan-50 text-cyan-800 border border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-500/30",
              )}
            >
              {n.level}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
