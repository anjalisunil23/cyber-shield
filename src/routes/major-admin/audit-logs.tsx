import { createFileRoute } from "@tanstack/react-router";
import { MOCK_AUDIT } from "@/data/mock/platform";
import {
  DataTable,
  PageScaffold,
  Pagination,
  Toolbar,
  useClientTable,
} from "@/components/ui-kit/PageKit";

export const Route = createFileRoute("/major-admin/audit-logs")({ component: Page });

function Page() {
  const table = useClientTable(MOCK_AUDIT, 6);
  return (
    <PageScaffold
      crumbs={[{ label: "Major Admin", to: "/major-admin/dashboard" }, { label: "Audit Logs" }]}
      title="Audit Logs"
      subtitle="Security and operational activity"
    >
      <Toolbar
        search={table.search}
        onSearch={table.setSearch}
        placeholder="Search actions, actors…"
      />
      <DataTable
        rows={table.rows}
        columns={[
          {
            key: "a",
            header: "Action",
            render: (r) => <span className="text-cyan">{r.action}</span>,
          },
          { key: "u", header: "Actor", render: (r) => r.actor },
          { key: "r", header: "Resource", render: (r) => r.resource },
          { key: "t", header: "Time", render: (r) => r.time },
          { key: "i", header: "IP", render: (r) => r.ip },
        ]}
      />
      <Pagination page={table.page} pages={table.pages} onPage={table.setPage} />
    </PageScaffold>
  );
}
