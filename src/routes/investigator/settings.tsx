import { createFileRoute, Link } from "@tanstack/react-router";
import { PageScaffold, Panel, PrimaryButton } from "@/components/ui-kit/PageKit";
import { ThemeSwitch } from "@/components/ui/ThemeToggle";

export const Route = createFileRoute("/investigator/settings")({ component: Page });

function Page() {
  return (
    <PageScaffold
      crumbs={[{ label: "Investigator", to: "/investigator/dashboard" }, { label: "Settings" }]}
      title="Settings"
      subtitle="Account & notifications"
      actions={
        <Link to={"/profile" as "/"} className="text-sm font-medium text-primary hover:underline">
          Open profile →
        </Link>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="General">
          <input
            defaultValue="Alex Mercer"
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
          />
          <PrimaryButton className="mt-3">Save</PrimaryButton>
        </Panel>
        <Panel title="Notifications">
          <label className="flex justify-between items-center text-sm text-foreground cursor-pointer">
            <span>Evidence alerts</span>
            <input type="checkbox" defaultChecked className="accent-primary h-4 w-4 rounded" />
          </label>
        </Panel>
        <Panel title="Theme">
          <ThemeSwitch label="Dark mode appearance" />
        </Panel>
        <Panel title="Security">
          <Link
            to={"/profile/security" as "/"}
            className="text-sm font-medium text-primary hover:underline"
          >
            Change password →
          </Link>
        </Panel>
      </div>
    </PageScaffold>
  );
}
