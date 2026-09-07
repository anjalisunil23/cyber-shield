import { createFileRoute } from "@tanstack/react-router";
import { PageScaffold, Panel, PrimaryButton } from "@/components/ui-kit/PageKit";

export const Route = createFileRoute("/superior/settings")({ component: Page });

function Page() {
  return (
    <PageScaffold
      crumbs={[{ label: "Superior", to: "/superior/dashboard" }, { label: "Settings" }]}
      title="Settings"
      subtitle="Preferences"
    >
      <Panel title="Account">
        <label className="block text-xs text-slate-400">
          Display name
          <input
            defaultValue="Ravi Menon"
            className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm"
          />
        </label>
        <PrimaryButton className="mt-4">Save</PrimaryButton>
      </Panel>
    </PageScaffold>
  );
}
