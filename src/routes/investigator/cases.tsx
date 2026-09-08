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
import { Loader2, Shield } from "lucide-react";

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

      let apiItems: InvestigationCase[] = [];
      try {
        const data = await investigationApi.listCases({
          page: 1,
          page_size: 100,
          q: searchQuery || undefined,
        });
        apiItems = data?.items || [];
      } catch {
        apiItems = [];
      }

      const map = new Map<string, InvestigationCase>();

      // 1. Seed fallback and stored cases (including Missing Child CS-2026-0003)
      const stored = getStoredCases();
      const fallback = stored.length > 0 ? stored : MOCK_CASES;
      fallback.forEach((sc) => {
        map.set(sc.caseNumber, {
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
        });
      });

      // 2. Overlay / Merge live backend API cases
      apiItems.forEach((c) => {
        map.set(c.case_number, c);
      });

      let allList = Array.from(map.values());

      // Filter by search query if provided
      if (searchQuery.trim()) {
        const qLower = searchQuery.toLowerCase().trim();
        allList = allList.filter(
          (c) =>
            c.case_number.toLowerCase().includes(qLower) ||
            c.title.toLowerCase().includes(qLower) ||
            (c.description && c.description.toLowerCase().includes(qLower))
        );
      }

      // Sort with critical/high priority first and updated date
      allList.sort((a, b) => {
        const pOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
        const pDiff = (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
        if (pDiff !== 0) return pDiff;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });

      const pageSize = 15;
      const totalPgs = Math.ceil(allList.length / pageSize) || 1;
      const pagedItems = allList.slice((page - 1) * pageSize, page * pageSize);

      setCases(pagedItems);
      setTotalPages(totalPgs);
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
          No cases matching your search.
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
                  const leadName =
                    r.investigator_lead?.full_name ||
                    (isLead ? "You (Lead)" : "Alex Mercer (Lead)");
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
