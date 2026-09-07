import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { investigationApi } from "@/services/investigationApi";

export const Route = createFileRoute("/dashboard/reports")({
  component: ReportsHubPage,
});

function ReportsHubPage() {
  const casesQ = useQuery({
    queryKey: ["cases", "reports-hub"],
    queryFn: () => investigationApi.listCases({ page_size: 30 }),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Reports</h1>
        <p className="text-sm text-slate-400">
          Generate investigation summaries — HTML (print/PDF) and CSV exports
        </p>
      </div>
      <ul className="space-y-2">
        {(casesQ.data?.items || []).map((c) => (
          <li key={c.id}>
            <Link
              to="/dashboard/cases/$caseId"
              params={{ caseId: c.id }}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-[#111827]/90 px-4 py-3 hover:border-cyan/30"
            >
              <span className="text-sm text-slate-200">{c.title}</span>
              <span className="text-xs text-cyan">Open reports tab →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
