import { PROFILE } from "@/services/dashboardData";

export function ProfileCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
      <h3 className="text-sm font-semibold text-foreground">Investigator Profile</h3>
      <div className="mt-4 flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-cyan text-lg font-bold text-white shadow-xs">
          AM
        </div>
        <div>
          <p className="font-semibold text-foreground">{PROFILE.name}</p>
          <p className="text-xs text-muted-foreground">{PROFILE.department}</p>
          <p className="text-xs font-semibold text-cyan">{PROFILE.role}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-muted/40 p-3">
          <p className="text-[11px] text-muted-foreground font-medium">Cases Assigned</p>
          <p className="mt-1 text-xl font-bold text-foreground">{PROFILE.casesAssigned}</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/40 p-3">
          <p className="text-[11px] text-muted-foreground font-medium">Performance</p>
          <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">{PROFILE.performance}</p>
        </div>
      </div>
    </div>
  );
}
