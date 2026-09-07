import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MOCK_CASES } from "@/data/mock/platform";
import {
  DataTable,
  PageScaffold,
  Pagination,
  SelectFilter,
  StatusPill,
  Toolbar,
  useClientTable,
} from "@/components/ui-kit/PageKit";

export const Route = createFileRoute("/major-admin/cases")({ component: Page });

function Page() {
  const [status, setStatus] = useState("All");
  const items = MOCK_CASES.filter((c) => status === "All" || c.status === status);
  const table = useClientTable(items);
  return (
    <PageScaffold
      crumbs={[{ label: "Major Admin", to: "/major-admin/dashboard" }, { label: "Cases" }]}
      title="Cases"
      subtitle="Global case oversight"
    >
      <Toolbar
        search={table.search}
        onSearch={table.setSearch}
        filters={
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
            ]}
          />
        }
      />
      <DataTable
        rows={table.rows}
        columns={[
          {
            key: "id",
            header: "Case",
            render: (r) => (
              <Link
                to="/superior/cases/$caseId"
                params={{ caseId: r.id || r.caseNumber }}
                className="text-cyan hover:underline font-semibold"
              >
                {r.caseNumber}
              </Link>
            ),
          },
          { key: "t", header: "Title", render: (r) => r.title },
          { key: "p", header: "Priority", render: (r) => <StatusPill value={r.priority} /> },
          { key: "s", header: "Status", render: (r) => <StatusPill value={r.status} /> },
          { key: "a", header: "Assignee", render: (r) => r.assignee },
          { key: "u", header: "Updated", render: (r) => r.updated },
        ]}
      />
      <Pagination page={table.page} pages={table.pages} onPage={table.setPage} />
    </PageScaffold>
  );
}
