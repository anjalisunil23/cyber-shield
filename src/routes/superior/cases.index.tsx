import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  DataTable,
  PageScaffold,
  Pagination,
  PrimaryButton,
  SelectFilter,
  StatusPill,
  Toolbar,
} from "@/components/ui-kit/PageKit";
import { CaseCard } from "@/components/ui-kit/Cards";
import { investigationApi } from "@/services/investigationApi";
import type { InvestigationCase, CaseStatus } from "@/services/types";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/superior/cases/")({ component: Page });

function Page() {
  const navigate = useNavigate();
  const [view, setView] = useState<"table" | "grid">("table");
  const [status, setStatus] = useState("All");
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      const data = await investigationApi.listCases({
        page,
        page_size: 15,
        status:
          status === "All" ? undefined : (status.toLowerCase().replace(/ /g, "_") as CaseStatus),
        q: searchQuery || undefined,
      });
      setCases(data.items || []);
      setTotalPages(data.pages || 1);
    } catch (err) {
      console.error("Failed to load cases", err);
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, [page, status, searchQuery]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  return (
    <PageScaffold
      crumbs={[{ label: "Superior", to: "/superior/dashboard" }, { label: "All Cases" }]}
      title="All Cases"
      subtitle="Create, assign, and monitor investigations"
      actions={
        <PrimaryButton onClick={() => void navigate({ to: "/superior/cases/create" })}>
          Create case
        </PrimaryButton>
      }
    >
      <Toolbar
        search={searchQuery}
        onSearch={setSearchQuery}
        filters={
          <>
            <SelectFilter
              value={status}
              onChange={setStatus}
              options={[
                "All",
                "Open",
                "Under Review",
                "Evidence Collection",
                "Analysis",
                "Completed",
                "Archived",
              ]}
            />
            <button
              type="button"
              onClick={() => setView(view === "table" ? "grid" : "table")}
              className="rounded-xl border border-border px-3 py-2 text-xs bg-card text-muted-foreground hover:text-foreground transition-colors"
            >
              {view === "table" ? "Grid view" : "Table view"}
            </button>
          </>
        }
      />
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading cases...
        </div>
      ) : cases.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          No cases found.
        </div>
      ) : view === "table" ? (
        <>
          <DataTable
            rows={cases}
            columns={[
              {
                key: "case_number",
                header: "Case",
                render: (r) => (
                  <Link
                    to="/superior/cases/$caseId"
                    params={{ caseId: r.id }}
                    className="text-primary hover:underline font-semibold"
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
                key: "assignee",
                header: "Assigned To",
                render: (r) =>
                  r.assignments && r.assignments.length > 0
                    ? r.assignments.map((a) => a.user?.full_name).join(", ")
                    : "Unassigned",
              },
            ]}
          />
          <Pagination page={page} pages={totalPages} onPage={setPage} />
        </>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cases.map((c) => (
            <Link key={c.id} to="/superior/cases/$caseId" params={{ caseId: c.id }}>
              <CaseCard
                item={{
                  id: c.id,
                  caseNumber: c.case_number,
                  title: c.title,
                  priority: (c.priority
                    ? c.priority.charAt(0).toUpperCase() + c.priority.slice(1)
                    : "Medium") as "Low" | "Medium" | "High" | "Critical",
                  status: c.status,
                  assignee:
                    c.assignments && c.assignments.length > 0
                      ? c.assignments[0].user?.full_name || "Agent"
                      : "Unassigned",
                  department: "Cybercrime",
                  created: new Date(c.created_at).toLocaleDateString(),
                  updated: new Date(c.updated_at).toLocaleDateString(),
                  description: c.description || "",
                }}
              />
            </Link>
          ))}
        </div>
      )}
    </PageScaffold>
  );
}
