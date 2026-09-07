import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { investigationApi } from "@/services/investigationApi";

export const Route = createFileRoute("/dashboard/evidence")({
  component: EvidencePage,
});

function EvidencePage() {
  const casesQ = useQuery({
    queryKey: ["cases", "evidence-hub"],
    queryFn: () => investigationApi.listCases({ page_size: 50 }),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Evidence</h1>
        <p className="text-sm text-slate-400">
          Open a case to upload, preview, search, and download evidence. AI fields are reserved for
          Phase 2.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {(casesQ.data?.items || []).map((c) => (
          <Link
            key={c.id}
            to="/dashboard/cases/$caseId"
            params={{ caseId: c.id }}
            className="rounded-2xl border border-white/10 bg-[#111827]/90 p-5 transition hover:border-cyan/40"
          >
            <p className="text-xs text-cyan">{c.case_number}</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">{c.title}</p>
            <p className="mt-2 text-xs text-slate-500">Open case → Evidence tab</p>
          </Link>
        ))}
      </div>
      {!casesQ.data?.items.length && !casesQ.isLoading && (
        <p className="text-sm text-slate-500">Create a case first to attach evidence.</p>
      )}
    </div>
  );
}
