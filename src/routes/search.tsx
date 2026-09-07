import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageScaffold, Panel, Toolbar } from "@/components/ui-kit/PageKit";
import { investigationApi } from "@/services/investigationApi";
import type { SearchResult } from "@/services/types";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/search")({ component: Page });

function Page() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult>({
    cases: [],
    evidence: [],
    notes: [],
    investigators: [],
    reports: [],
  });

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setResults({ cases: [], evidence: [], notes: [], investigators: [], reports: [] });
      return;
    }
    setLoading(true);
    try {
      const data = await investigationApi.search(query);
      setResults(data);
    } catch {
      setResults({ cases: [], evidence: [], notes: [], investigators: [], reports: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(q);
    }, 400);
    return () => clearTimeout(timer);
  }, [q]);

  return (
    <div className="min-h-screen bg-[#020617] px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <PageScaffold
          crumbs={[{ label: "App" }, { label: "Global Search" }]}
          title="Global Search"
          subtitle="Cases, evidence, notes, investigators"
        >
          <Toolbar search={q} onSearch={setQ} placeholder="Type to search everything…" />
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Searching database...
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 mt-4">
              <Panel title={`Cases (${results.cases?.length || 0})`}>
                <ul className="space-y-1.5 text-sm">
                  {(results.cases || []).map((c) => (
                    <li key={c.id} className="text-slate-300 border-b border-white/5 pb-1">
                      <span className="text-purple-400 font-semibold text-xs mr-2">
                        {c.case_number}
                      </span>
                      {c.title}
                    </li>
                  ))}
                  {(!results.cases || results.cases.length === 0) && (
                    <span className="text-xs text-slate-500">No cases match</span>
                  )}
                </ul>
              </Panel>
              <Panel title={`Evidence (${results.evidence?.length || 0})`}>
                <ul className="space-y-1.5 text-sm">
                  {(results.evidence || []).map((e) => (
                    <li
                      key={e.id}
                      className="text-slate-300 border-b border-white/5 pb-1 flex justify-between"
                    >
                      <span>{e.original_name}</span>
                      <span className="text-xs text-slate-500 uppercase">{e.file_type}</span>
                    </li>
                  ))}
                  {(!results.evidence || results.evidence.length === 0) && (
                    <span className="text-xs text-slate-500">No evidence matches</span>
                  )}
                </ul>
              </Panel>
              <Panel title={`Notes (${results.notes?.length || 0})`}>
                <ul className="space-y-1.5 text-sm">
                  {(results.notes || []).map((n) => (
                    <li key={n.id} className="text-slate-300 border-b border-white/5 pb-1">
                      <p className="font-semibold text-xs text-purple-300">{n.title || "Note"}</p>
                      <p className="text-xs text-slate-400 truncate">{n.body}</p>
                    </li>
                  ))}
                  {(!results.notes || results.notes.length === 0) && (
                    <span className="text-xs text-slate-500">No notes match</span>
                  )}
                </ul>
              </Panel>
              <Panel title={`Investigators (${results.investigators?.length || 0})`}>
                <ul className="space-y-1.5 text-sm">
                  {(results.investigators || []).map((u) => (
                    <li
                      key={u.id}
                      className="text-slate-300 border-b border-white/5 pb-1 flex justify-between"
                    >
                      <span>{u.full_name}</span>
                      <span className="text-xs text-slate-500">{u.email}</span>
                    </li>
                  ))}
                  {(!results.investigators || results.investigators.length === 0) && (
                    <span className="text-xs text-slate-500">No investigators match</span>
                  )}
                </ul>
              </Panel>
            </div>
          )}
        </PageScaffold>
      </div>
    </div>
  );
}
