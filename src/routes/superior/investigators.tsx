import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { UserCheck } from "lucide-react";
import { MOCK_USERS, MockUser } from "@/data/mock/platform";
import {
  DataTable,
  PageScaffold,
  Pagination,
  StatusPill,
  Toolbar,
  useClientTable,
  GhostButton,
} from "@/components/ui-kit/PageKit";
import { AssignTaskModal } from "@/components/superior/AssignTaskModal";

export const Route = createFileRoute("/superior/investigators")({ component: Page });

function Page() {
  const rows = MOCK_USERS.filter((u) => u.role === "Investigator" || u.role === "Forensic Officer");
  const table = useClientTable(rows);
  const [selectedInvestigator, setSelectedInvestigator] = useState<string | null>(null);

  return (
    <PageScaffold
      crumbs={[{ label: "Superior", to: "/superior/dashboard" }, { label: "Investigators" }]}
      title="Investigators Directory"
      subtitle="Team officers available for case & task assignment"
    >
      <Toolbar search={table.search} onSearch={table.setSearch} />
      <DataTable
        rows={table.rows}
        columns={[
          {
            key: "n",
            header: "Name",
            render: (r) => <span className="font-medium text-foreground">{r.name}</span>,
          },
          { key: "e", header: "Email", render: (r) => r.email },
          {
            key: "r",
            header: "Role",
            render: (r) => <span className="text-xs text-cyan">{r.role}</span>,
          },
          { key: "d", header: "Department", render: (r) => r.department },
          { key: "s", header: "Status", render: (r) => <StatusPill value={r.status} /> },
          {
            key: "a",
            header: "Action",
            render: (r: MockUser) => (
              <GhostButton
                onClick={() => setSelectedInvestigator(r.name)}
                className="text-xs text-cyan hover:bg-cyan/10"
              >
                <UserCheck className="mr-1 inline h-3.5 w-3.5" /> Assign Task
              </GhostButton>
            ),
          },
        ]}
      />
      <Pagination page={table.page} pages={table.pages} onPage={table.setPage} />

      {selectedInvestigator && (
        <AssignTaskModal
          isOpen={true}
          defaultInvestigator={selectedInvestigator}
          onClose={() => setSelectedInvestigator(null)}
        />
      )}
    </PageScaffold>
  );
}
