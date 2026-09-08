import { Link } from "@tanstack/react-router";
import { MoreHorizontal } from "lucide-react";
import {
  Badge,
  formatLabel,
  priorityBadgeClass,
  statusBadgeClass,
} from "@/components/dashboard/Badge";
import type { InvestigationCase } from "@/services/types";

export function CaseTable({ rows, filter = "" }: { rows: InvestigationCase[]; filter?: string }) {
  const q = filter.trim().toLowerCase();
  const filtered = q
    ? rows.filter(
        (r) =>
          r.case_number.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q) ||
          r.assignments.some((a) => a.user?.full_name.toLowerCase().includes(q)),
      )
    : rows;

  if (!filtered.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center shadow-xs">
        <p className="text-sm text-muted-foreground">
          No cases found. Create your first investigation case.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground font-semibold">
          <tr>
            <th className="px-4 py-3 font-semibold">Case ID</th>
            <th className="px-4 py-3 font-semibold">Title</th>
            <th className="px-4 py-3 font-semibold">Priority</th>
            <th className="px-4 py-3 font-semibold">Assigned Officer</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Last Updated</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((row) => {
            const officer =
              row.assignments.find((a) => a.is_primary)?.user?.full_name ||
              row.assignments[0]?.user?.full_name ||
              row.created_by?.full_name ||
              "—";
            return (
              <tr key={row.id} className="border-b border-border/50 transition hover:bg-muted/30">
                <td className="px-4 py-3 font-semibold text-primary">
                  <Link
                    to="/dashboard/cases/$caseId"
                    params={{ caseId: row.id }}
                    className="hover:underline"
                  >
                    {row.case_number}
                  </Link>
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{row.title}</td>
                <td className="px-4 py-3">
                  <Badge className={priorityBadgeClass(row.priority)}>
                    {formatLabel(row.priority)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{officer}</td>
                <td className="px-4 py-3">
                  <Badge className={statusBadgeClass(row.status)}>{formatLabel(row.status)}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(row.updated_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <Link
                    to="/dashboard/cases/$caseId"
                    params={{ caseId: row.id }}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground inline-flex transition"
                    aria-label="Open case"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
