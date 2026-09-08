import { createFileRoute } from "@tanstack/react-router";
import { PageScaffold, Panel, StatusPill } from "@/components/ui-kit/PageKit";

export const Route = createFileRoute("/major-admin/roles")({ component: Page });

const ROLES = [
  { role: "Major Admin", perms: ["Manage admins", "Departments", "Global audit", "Backups"] },
  { role: "Admin", perms: ["Create officers", "Manage users", "District cases", "Reports"] },
  {
    role: "Superior Officer",
    perms: ["Create cases", "Assign investigators", "Approve reports", "Close cases"],
  },
  { role: "Investigator", perms: ["Upload evidence", "Notes", "Manual leads", "Draft reports"] },
];

function Page() {
  return (
    <PageScaffold
      crumbs={[
        { label: "Major Admin", to: "/major-admin/dashboard" },
        { label: "Roles & Permissions" },
      ]}
      title="Roles & Permissions"
      subtitle="RBAC matrix (UI mock)"
    >
      <div className="grid gap-4 md:grid-cols-2">
        {ROLES.map((r) => (
          <Panel key={r.role} title={r.role}>
            <ul className="space-y-2">
              {r.perms.map((p) => (
                <li key={p} className="flex items-center justify-between text-sm text-foreground">
                  <span>{p}</span>
                  <StatusPill value="Allowed" />
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </PageScaffold>
  );
}
