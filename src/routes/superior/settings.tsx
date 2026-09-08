import { createFileRoute } from "@tanstack/react-router";
import { PageScaffold, Panel, PrimaryButton } from "@/components/ui-kit/PageKit";
import { ThemeSwitch } from "@/components/ui/ThemeToggle";

export const Route = createFileRoute("/superior/settings")({ component: Page });

function Page() {
  return (
    <PageScaffold
      crumbs={[{ label: "Superior", to: "/superior/dashboard" }, { label: "Settings" }]}
      title="Settings"
      subtitle="Preferences & appearance"
    >
      <div className="space-y-4 max-w-2xl">
        <Panel title="Appearance">
          <div className="space-y-2">
            <label className="block text-xs text-muted-foreground">Interface Theme</label>
            <ThemeSwitch />
          </div>
        </Panel>

        <Panel title="Account">
          <label className="block text-xs text-muted-foreground">
            Display name
            <input
              defaultValue="Ravi Menon"
              className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
          <PrimaryButton className="mt-4">Save Changes</PrimaryButton>
        </Panel>
      </div>
    </PageScaffold>
  );
}
