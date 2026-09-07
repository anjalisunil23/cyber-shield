import { createFileRoute, Link } from "@tanstack/react-router";
import { MOCK_USERS } from "@/data/mock/platform";
import {
  DataTable,
  PageScaffold,
  Pagination,
  StatusPill,
  Toolbar,
  useClientTable,
  SelectFilter,
} from "@/components/ui-kit/PageKit";
import { useState } from "react";

export const Route = createFileRoute("/major-admin/users")({ component: Page });

function Page() {
  const [role, setRole] = useState("All roles");
  const filtered = MOCK_USERS.filter((u) => role === "All roles" || u.role === role);
  const table = useClientTable(filtered);
  return (
    <PageScaffold
      crumbs={[{ label: "Major Admin", to: "/major-admin/dashboard" }, { label: "Users" }]}
      title="Users"
      subtitle="Platform-wide directory"
    >
      <Toolbar
        search={table.search}
        onSearch={table.setSearch}
        filters={
          <SelectFilter
            value={role}
            onChange={setRole}
            options={["All roles", "Major Admin", "Admin", "Superior Officer", "Investigator"]}
          />
        }
      />
      <DataTable
        rows={table.rows}
        columns={[
          {
            key: "n",
            header: "Name",
            render: (r) => (
              <Link
                to={"/major-admin/users/$userId" as "/"}
                params={{ userId: r.id } as never}
                className="text-cyan hover:underline"
              >
                {r.name}
              </Link>
            ),
          },
          { key: "e", header: "Email", render: (r) => r.email },
          { key: "r", header: "Role", render: (r) => r.role },
          { key: "d", header: "Department", render: (r) => r.department },
          { key: "s", header: "Status", render: (r) => <StatusPill value={r.status} /> },
        ]}
      />
      <Pagination page={table.page} pages={table.pages} onPage={table.setPage} />
    </PageScaffold>
  );
}
