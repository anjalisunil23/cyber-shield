import { createFileRoute, Link } from "@tanstack/react-router";
import { PageScaffold, Panel, PrimaryButton } from "@/components/ui-kit/PageKit";

export const Route = createFileRoute("/investigator/settings")({ component: Page });

function Page() {
  return (
    <PageScaffold
      crumbs={[{ label: "Investigator", to: "/investigator/dashboard" }, { label: "Settings" }]}
      title="Settings"
      subtitle="Account & notifications"
      actions={
        <Link to={"/profile" as "/"} className="text-sm text-cyan">
          Open profile →
        </Link>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="General">
          <input
            defaultValue="Alex Mercer"
            className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm"
          />
          <PrimaryButton className="mt-3">Save</PrimaryButton>
        </Panel>
        <Panel title="Notifications">
          <label className="flex justify-between text-sm">
            <span>Evidence alerts</span>
            <input type="checkbox" defaultChecked className="accent-cyan" />
          </label>
        </Panel>
        <Panel title="Theme">
          <label className="flex justify-between text-sm">
            <span>Dark mode</span>
            <input type="checkbox" defaultChecked className="accent-cyan" />
          </label>
        </Panel>
        <Panel title="Security">
          <Link to={"/profile/security" as "/"} className="text-sm text-cyan">
            Change password →
          </Link>
        </Panel>
      </div>
    </PageScaffold>
  );
}
