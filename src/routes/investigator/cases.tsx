import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  DataTable,
  PageScaffold,
  Pagination,
  StatusPill,
  Toolbar,
} from "@/components/ui-kit/PageKit";
import { investigationApi } from "@/services/investigationApi";
import type { InvestigationCase } from "@/services/types";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/investigator/cases")({ component: Page });

function Page() {
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const loadCases = async () => {
    setLoading(true);
    try {
      const data = await investigationApi.listCases({
        page,
        page_size: 15,
        q: searchQuery || undefined,
      });
      setCases(data.items || []);
      setTotalPages(data.pages || 1);
    } catch {
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [page, searchQuery]);

  return (
    <PageScaffold
      crumbs={[{ label: "Investigator", to: "/investigator/dashboard" }, { label: "My Cases" }]}
      title="My Cases"
      subtitle="Cases assigned to you or created by you"
    >
      <Toolbar search={searchQuery} onSearch={setSearchQuery} />
      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading cases...
        </div>
      ) : cases.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-8 text-center text-slate-400">
          No cases assigned.
        </div>
      ) : (
        <>
          <DataTable
            rows={cases}
            columns={[
              {
                key: "case_number",
                header: "Case",
                render: (r) => (
                  <Link
                    to="/investigator/cases/$caseId"
                    params={{ caseId: r.id }}
                    className="text-purple-400 hover:text-purple-300 font-semibold hover:underline"
                  >
                    {r.case_number}
                  </Link>
                ),
              },
              { key: "title", header: "Title", render: (r) => r.title },
              {
                key: "priority",
                header: "Priority",
                render: (r) => <StatusPill value={r.priority} />,
              },
              { key: "status", header: "Status", render: (r) => <StatusPill value={r.status} /> },
              {
                key: "updated_at",
                header: "Updated",
                render: (r) => new Date(r.updated_at).toLocaleDateString(),
              },
            ]}
          />
          <Pagination page={page} pages={totalPages} onPage={setPage} />
        </>
      )}
    </PageScaffold>
  );
}
