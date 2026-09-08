import { createFileRoute } from "@tanstack/react-router";
import { MOCK_DEPARTMENTS, MOCK_USERS, MOCK_CASES } from "@/data/mock/platform";
import { PageScaffold, Panel, StatusPill } from "@/components/ui-kit/PageKit";

export const Route = createFileRoute("/major-admin/departments/$deptId")({ component: Page });

function Page() {
  const { deptId } = Route.useParams();
  const dept = MOCK_DEPARTMENTS.find((d) => d.id === deptId) || MOCK_DEPARTMENTS[0];
  return (
    <PageScaffold
      crumbs={[{ label: "Departments", to: "/major-admin/departments" }, { label: dept.name }]}
      title={dept.name}
      subtitle={dept.description}
      actions={<StatusPill value={dept.status} />}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Overview">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Code</dt>
              <dd className="text-foreground font-medium">{dept.code}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Officers</dt>
              <dd className="text-foreground">{dept.officers}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Cases</dt>
              <dd className="text-foreground">{dept.cases}</dd>
            </div>
          </dl>
        </Panel>
        <Panel title="People" className="lg:col-span-2">
          <ul className="space-y-2">
            {MOCK_USERS.slice(0, 4).map((u) => (
              <li key={u.id} className="flex justify-between text-sm">
                <span className="text-foreground">{u.name}</span>
                <span className="text-cyan text-xs">{u.role}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Recent cases" className="lg:col-span-3">
          <ul className="space-y-2">
            {MOCK_CASES.slice(0, 4).map((c) => (
              <li key={c.id} className="text-sm text-muted-foreground">
                <span className="text-foreground">{c.caseNumber}</span> — {c.title}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </PageScaffold>
  );
}
