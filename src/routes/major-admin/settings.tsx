import { createFileRoute } from "@tanstack/react-router";
import { PageScaffold, Panel, PrimaryButton } from "@/components/ui-kit/PageKit";
import { ThemeSwitch } from "@/components/ui/ThemeToggle";

export const Route = createFileRoute("/major-admin/settings")({ component: Page });

function Page() {
  return (
    <PageScaffold
      crumbs={[
        { label: "Major Admin", to: "/major-admin/dashboard" },
        { label: "Platform Settings" },
      ]}
      title="Platform Settings"
      subtitle="System configuration & appearance"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Appearance">
          <div className="space-y-2">
            <label className="block text-xs text-muted-foreground">Interface Theme</label>
            <ThemeSwitch />
          </div>
        </Panel>

        <Panel title="General">
          <label className="block text-xs text-muted-foreground">
            Platform name
            <input
              defaultValue="CyberShield"
              className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
          <label className="mt-3 block text-xs text-muted-foreground">
            Support email
            <input
              defaultValue="support@cybershield.gov"
              className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
          <PrimaryButton className="mt-4">Save</PrimaryButton>
        </Panel>

        <Panel title="Security">
          <label className="flex items-center justify-between text-sm text-foreground">
            <span>Require MFA for admins</span>
            <input type="checkbox" defaultChecked className="accent-primary h-4 w-4 rounded" />
          </label>
          <label className="mt-3 flex items-center justify-between text-sm text-foreground">
            <span>Session timeout (minutes)</span>
            <input
              type="number"
              defaultValue={60}
              className="w-20 rounded-lg border border-border bg-input px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
        </Panel>
      </div>
    </PageScaffold>
  );
}
