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
import { getStoredCases } from "@/data/mock/platformState";
import { MOCK_CASES } from "@/data/mock/platform";
import { Loader2, Shield, UserCheck } from "lucide-react";

export const Route = createFileRoute("/investigator/cases")({ component: Page });

function Page() {
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadCases = async () => {
    setLoading(true);
    try {
      const me = await investigationApi.me().catch(() => null);
      if (me?.id) setCurrentUserId(me.id);

      const data = await investigationApi.listCases({
        page,
        page_size: 15,
        q: searchQuery || undefined,
      });

      const apiItems = data?.items || [];

      // If backend returned cases, use them
      if (apiItems.length > 0) {
        setCases(apiItems);
        setTotalPages(data.pages || 1);
      } else {
        // Fallback to stored platform cases
        const stored = getStoredCases();
        const fallback = stored.length > 0 ? stored : MOCK_CASES;
        const mapped: InvestigationCase[] = fallback.map((sc) => ({
          id: sc.id,
          case_number: sc.caseNumber,
          title: sc.title,
          description: sc.description || "Investigation case",
          priority: sc.priority.toLowerCase() as InvestigationCase["priority"],
          status: sc.status.toLowerCase().replace(" ", "_") as InvestigationCase["status"],
          notes: null,
          created_by_id: "system",
          created_at: sc.created || new Date().toISOString(),
          updated_at: sc.updated || new Date().toISOString(),
          assignments: [],
        }));
        setCases(mapped);
        setTotalPages(1);
      }
    } catch {
      // Offline fallback
      const stored = getStoredCases();
      const fallback = stored.length > 0 ? stored : MOCK_CASES;
      const mapped: InvestigationCase[] = fallback.map((sc) => ({
        id: sc.id,
        case_number: sc.caseNumber,
        title: sc.title,
        description: sc.description || "Investigation case",
        priority: sc.priority.toLowerCase() as InvestigationCase["priority"],
        status: sc.status.toLowerCase().replace(" ", "_") as InvestigationCase["status"],
        notes: null,
        created_by_id: "system",
        created_at: sc.created || new Date().toISOString(),
        updated_at: sc.updated || new Date().toISOString(),
        assignments: [],
      }));
      setCases(mapped);
      setTotalPages(1);
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
      title="My Assigned Cases"
      subtitle="Investigation cases assigned to you as Investigator Lead or Team Investigator"
    >
      <Toolbar search={searchQuery} onSearch={setSearchQuery} />
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading cases...
        </div>
      ) : cases.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground shadow-xs">
          No cases assigned yet.
        </div>
      ) : (
        <>
          <DataTable
            rows={cases}
            columns={[
              {
                key: "case_number",
                header: "Case Number",
                render: (r) => (
                  <Link
                    to="/dashboard/cases/$caseId"
                    params={{ caseId: r.id }}
                    className="text-primary font-bold hover:underline inline-flex items-center gap-1.5"
                  >
                    <span>{r.case_number}</span>
                  </Link>
                ),
              },
              {
                key: "title",
                header: "Case Title & Description",
                render: (r) => (
                  <div>
                    <p className="font-semibold text-foreground text-sm">{r.title}</p>
                    {r.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-md">
                        {r.description}
                      </p>
                    )}
                  </div>
                ),
              },
              {
                key: "lead",
                header: "Investigator Lead",
                render: (r) => {
                  const isLead = r.investigator_lead_id === currentUserId;
                  const leadName = r.investigator_lead?.full_name || (isLead ? "You (Lead)" : "Assigned Lead");
                  return (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                      <Shield className="h-3 w-3 text-amber-500" />
                      {leadName}
                    </span>
                  );
                },
              },
              {
                key: "priority",
                header: "Priority",
                render: (r) => <StatusPill value={r.priority} />,
              },
              { key: "status", header: "Status", render: (r) => <StatusPill value={r.status} /> },
              {
                key: "updated_at",
                header: "Last Activity",
                render: (r) => new Date(r.updated_at).toLocaleDateString(),
              },
              {
                key: "actions",
                header: "Action",
                render: (r) => (
                  <Link
                    to="/dashboard/cases/$caseId"
                    params={{ caseId: r.id }}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-1 text-xs font-semibold transition"
                  >
                    Open Case →
                  </Link>
                ),
              },
            ]}
          />
          <Pagination page={page} pages={totalPages} onPage={setPage} />
        </>
      )}
    </PageScaffold>
  );
}
