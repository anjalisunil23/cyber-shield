import { createFileRoute } from "@tanstack/react-router";
import { PageScaffold, Panel, PrimaryButton } from "@/components/ui-kit/PageKit";

export const Route = createFileRoute("/major-admin/settings")({ component: Page });

function Page() {
  return (
    <PageScaffold
      crumbs={[
        { label: "Major Admin", to: "/major-admin/dashboard" },
        { label: "Platform Settings" },
      ]}
      title="Platform Settings"
      subtitle="System configuration (UI only)"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="General">
          <label className="block text-xs text-slate-400">
            Platform name
            <input
              defaultValue="CyberShield"
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm"
            />
          </label>
          <label className="mt-3 block text-xs text-slate-400">
            Support email
            <input
              defaultValue="support@cybershield.gov"
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm"
            />
          </label>
          <PrimaryButton className="mt-4">Save</PrimaryButton>
        </Panel>
        <Panel title="Security">
          <label className="flex items-center justify-between text-sm text-slate-300">
            <span>Require MFA for admins</span>
            <input type="checkbox" defaultChecked className="accent-cyan" />
          </label>
          <label className="mt-3 flex items-center justify-between text-sm text-slate-300">
            <span>Session timeout (minutes)</span>
            <input
              type="number"
              defaultValue={60}
              className="w-20 rounded-lg border border-white/10 bg-[#0b1220] px-2 py-1 text-sm"
            />
          </label>
        </Panel>
      </div>
    </PageScaffold>
  );
}
