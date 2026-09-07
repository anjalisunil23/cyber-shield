import { createFileRoute, Link } from "@tanstack/react-router";
import { MOCK_LEADS } from "@/data/mock/platform";
import {
  DataTable,
  PageScaffold,
  Pagination,
  PrimaryButton,
  StatusPill,
  Toolbar,
  useClientTable,
  Panel,
} from "@/components/ui-kit/PageKit";
import { useState } from "react";

export const Route = createFileRoute("/superior/leads")({ component: Page });

function Page() {
  const table = useClientTable(MOCK_LEADS);
  const [title, setTitle] = useState("");
  return (
    <PageScaffold
      crumbs={[{ label: "Superior", to: "/superior/dashboard" }, { label: "Manual Leads" }]}
      title="Manual Leads"
      subtitle="No AI generation — investigator-created leads"
    >
      <Panel title="New lead">
        <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Lead title"
            className="flex-1 rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm"
          />
          <PrimaryButton type="submit">Create</PrimaryButton>
        </form>
      </Panel>
      <div className="mt-4" />
      <Toolbar search={table.search} onSearch={table.setSearch} />
      <DataTable
        rows={table.rows}
        columns={[
          { key: "t", header: "Title", render: (r) => r.title },
          {
            key: "c",
            header: "Case",
            render: (r) => (
              <Link
                to="/superior/cases/$caseId"
                params={{ caseId: r.caseNumber }}
                className="text-cyan hover:underline font-semibold"
              >
                {r.caseNumber}
              </Link>
            ),
          },
          { key: "p", header: "Priority", render: (r) => <StatusPill value={r.priority} /> },
          { key: "s", header: "Status", render: (r) => <StatusPill value={r.status} /> },
          { key: "a", header: "Assignee", render: (r) => r.assignee },
        ]}
      />
      <Pagination page={table.page} pages={table.pages} onPage={table.setPage} />
    </PageScaffold>
  );
}
