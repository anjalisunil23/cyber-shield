import { createFileRoute, Link } from "@tanstack/react-router";
import { MOCK_DEPARTMENTS } from "@/data/mock/platform";
import {
  PageScaffold,
  Toolbar,
  useClientTable,
  Pagination,
  PrimaryButton,
  DataTable,
  StatusPill,
} from "@/components/ui-kit/PageKit";

export const Route = createFileRoute("/major-admin/departments")({ component: Page });

function Page() {
  const table = useClientTable(MOCK_DEPARTMENTS);
  return (
    <PageScaffold
      crumbs={[{ label: "Major Admin", to: "/major-admin/dashboard" }, { label: "Departments" }]}
      title="Departments"
      subtitle="Investigation units across the platform"
      actions={<PrimaryButton>Add department</PrimaryButton>}
    >
      <Toolbar search={table.search} onSearch={table.setSearch} />
      <DataTable
        rows={table.rows}
        columns={[
          {
            key: "name",
            header: "Name",
            render: (r) => (
              <Link
                to={"/major-admin/departments/$deptId" as "/"}
                params={{ deptId: r.id } as never}
                className="font-medium text-cyan hover:underline"
              >
                {r.name}
              </Link>
            ),
          },
          { key: "code", header: "Code", render: (r) => r.code },
          { key: "officers", header: "Officers", render: (r) => r.officers },
          { key: "cases", header: "Cases", render: (r) => r.cases },
          { key: "status", header: "Status", render: (r) => <StatusPill value={r.status} /> },
        ]}
      />
      <Pagination page={table.page} pages={table.pages} onPage={table.setPage} />
    </PageScaffold>
  );
}
