import { createFileRoute } from "@tanstack/react-router";
import { MOCK_STORAGE } from "@/data/mock/platform";
import { PageScaffold, Panel } from "@/components/ui-kit/PageKit";

export const Route = createFileRoute("/major-admin/storage")({ component: Page });

function Page() {
  return (
    <PageScaffold
      crumbs={[{ label: "Major Admin", to: "/major-admin/dashboard" }, { label: "Storage" }]}
      title="Storage Management"
      subtitle="Vault usage overview (mock)"
    >
      <div className="grid gap-4 md:grid-cols-3">
        {MOCK_STORAGE.map((s) => (
          <Panel key={s.name} title={s.name}>
            <p className="text-2xl font-bold text-foreground">{s.used}%</p>
            <p className="text-xs text-muted-foreground">of {s.total}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-cyan"
                style={{ width: `${s.used}%` }}
              />
            </div>
          </Panel>
        ))}
      </div>
    </PageScaffold>
  );
}
