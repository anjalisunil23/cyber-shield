import { Badge, priorityBadgeClass, statusBadgeClass } from "@/components/dashboard/Badge";
import { PRIORITY_QUEUE } from "@/services/dashboardData";

export function PriorityQueue() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground">Priority Queue</h3>
      </div>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold bg-muted/40">
          <tr>
            <th className="px-5 py-3 font-semibold">Case Name</th>
            <th className="px-5 py-3 font-semibold">Priority</th>
            <th className="px-5 py-3 font-semibold">Deadline</th>
            <th className="px-5 py-3 font-semibold">Assigned To</th>
            <th className="px-5 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {PRIORITY_QUEUE.map((r) => (
            <tr key={r.name} className="border-t border-border/50 transition hover:bg-muted/30">
              <td className="px-5 py-3 font-medium text-foreground">{r.name}</td>
              <td className="px-5 py-3">
                <Badge className={priorityBadgeClass(r.priority)}>{r.priority}</Badge>
              </td>
              <td className="px-5 py-3 text-muted-foreground">{r.deadline}</td>
              <td className="px-5 py-3 text-muted-foreground">{r.assignee}</td>
              <td className="px-5 py-3">
                <Badge className={statusBadgeClass(r.status)}>{r.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
