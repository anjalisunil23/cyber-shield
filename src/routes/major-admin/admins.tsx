import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  Breadcrumb,
  DataTable,
  EmptyState,
  GhostButton,
  Modal,
  PageScaffold,
  Pagination,
  PrimaryButton,
  SelectFilter,
  StatusPill,
  Toolbar,
  useClientTable,
  Panel,
} from "@/components/ui-kit/PageKit";
import {
  CaseCard,
  EvidenceCard,
  NotificationCard,
  ProfileCard,
  RelationshipCard,
  ReportCard,
  TaskCard,
} from "@/components/ui-kit/Cards";

import { MOCK_USERS } from "@/data/mock/platform";

export const Route = createFileRoute("/major-admin/admins")({ component: Page });

function Page() {
  const admins = MOCK_USERS.filter((u) => u.role === "Admin" || u.role === "Major Admin");
  const table = useClientTable(admins);
  const [open, setOpen] = useState(false);
  return (
    <PageScaffold
      crumbs={[{ label: "Major Admin", to: "/major-admin/dashboard" }, { label: "Admins" }]}
      title="Admins"
      subtitle="Create, edit, and suspend Admin accounts"
      actions={
        <PrimaryButton onClick={() => setOpen(true)}>
          <Plus className="mr-1 inline h-4 w-4" /> Create Admin
        </PrimaryButton>
      }
    >
      <Toolbar
        search={table.search}
        onSearch={table.setSearch}
        placeholder="Search admins…"
        actions={
          <Link to={"/major-admin/admins/create" as "/"}>
            <GhostButton>Full create form</GhostButton>
          </Link>
        }
      />
      <DataTable
        rows={table.rows}
        columns={[
          {
            key: "name",
            header: "Name",
            render: (r) => <span className="font-medium text-foreground">{r.name}</span>,
          },
          { key: "email", header: "Email", render: (r) => r.email },
          { key: "dept", header: "Department", render: (r) => r.department },
          { key: "status", header: "Status", render: (r) => <StatusPill value={r.status} /> },
          { key: "login", header: "Last login", render: (r) => r.lastLogin },
          {
            key: "actions",
            header: "",
            render: (r) => (
              <Link
                to={"/major-admin/admins/$adminId/edit" as "/"}
                params={{ adminId: r.id } as never}
                className="text-xs text-cyan hover:underline"
              >
                Edit
              </Link>
            ),
          },
        ]}
      />
      <Pagination page={table.page} pages={table.pages} onPage={table.setPage} />
      <Modal open={open} title="Quick create Admin" onClose={() => setOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setOpen(false);
          }}
        >
          <input
            required
            placeholder="Full name"
            className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            required
            type="email"
            placeholder="Email"
            className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            placeholder="Department"
            className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <PrimaryButton type="submit" className="w-full">
            Save (UI only)
          </PrimaryButton>
        </form>
      </Modal>
    </PageScaffold>
  );
}
