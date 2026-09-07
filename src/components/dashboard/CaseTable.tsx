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
      <div className="rounded-2xl border border-dashed border-white/15 bg-[#111827]/60 px-6 py-16 text-center">
        <p className="text-sm text-slate-400">
          No cases found. Create your first investigation case.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#111827]/90">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Case ID</th>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Priority</th>
            <th className="px-4 py-3 font-medium">Assigned Officer</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Last Updated</th>
            <th className="px-4 py-3 font-medium">Actions</th>
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
              <tr key={row.id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                <td className="px-4 py-3 font-medium text-cyan">
                  <Link
                    to="/dashboard/cases/$caseId"
                    params={{ caseId: row.id }}
                    className="hover:underline"
                  >
                    {row.case_number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-200">{row.title}</td>
                <td className="px-4 py-3">
                  <Badge className={priorityBadgeClass(row.priority)}>
                    {formatLabel(row.priority)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-slate-300">{officer}</td>
                <td className="px-4 py-3">
                  <Badge className={statusBadgeClass(row.status)}>{formatLabel(row.status)}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {new Date(row.updated_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <Link
                    to="/dashboard/cases/$caseId"
                    params={{ caseId: row.id }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white inline-flex"
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
