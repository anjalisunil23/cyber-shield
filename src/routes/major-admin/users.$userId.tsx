import { createFileRoute } from "@tanstack/react-router";
import { MOCK_USERS, MOCK_AUDIT } from "@/data/mock/platform";
import { PageScaffold, Panel, StatusPill } from "@/components/ui-kit/PageKit";
import { ProfileCard } from "@/components/ui-kit/Cards";

export const Route = createFileRoute("/major-admin/users/$userId")({ component: Page });

function Page() {
  const { userId } = Route.useParams();
  const user = MOCK_USERS.find((u) => u.id === userId) || MOCK_USERS[0];
  return (
    <PageScaffold
      crumbs={[{ label: "Users", to: "/major-admin/users" }, { label: user.name }]}
      title="User details"
      subtitle={user.email}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <ProfileCard
          name={user.name}
          email={user.email}
          role={user.role}
          department={user.department}
        />
        <Panel title="Account">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <StatusPill value={user.status} />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="text-foreground">{user.phone || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Last login</dt>
              <dd className="text-foreground">{user.lastLogin}</dd>
            </div>
          </dl>
        </Panel>
        <Panel title="Recent activity" className="lg:col-span-2">
          <ul className="space-y-2">
            {MOCK_AUDIT.slice(0, 4).map((a) => (
              <li key={a.id} className="text-sm text-muted-foreground">
                <span className="text-cyan font-medium">{a.action}</span> — {a.resource}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </PageScaffold>
  );
}
