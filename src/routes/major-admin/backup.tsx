import { createFileRoute } from "@tanstack/react-router";
import {
  PageScaffold,
  Panel,
  PrimaryButton,
  GhostButton,
  StatusPill,
} from "@/components/ui-kit/PageKit";

export const Route = createFileRoute("/major-admin/backup")({ component: Page });

function Page() {
  return (
    <PageScaffold
      crumbs={[
        { label: "Major Admin", to: "/major-admin/dashboard" },
        { label: "Backup & Restore" },
      ]}
      title="Backup & Restore"
      subtitle="Operational continuity controls (UI mock)"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Latest backups">
          <ul className="space-y-3">
            {[
              ["Nightly full", "2026-08-03 02:00", "Success"],
              ["Incremental", "2026-08-02 14:00", "Success"],
              ["Config snapshot", "2026-08-01 09:00", "Success"],
            ].map(([n, t, s]) => (
              <li key={n} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-foreground">{n}</p>
                  <p className="text-xs text-muted-foreground">{t}</p>
                </div>
                <StatusPill value={s} />
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <PrimaryButton>Run backup</PrimaryButton>
            <GhostButton>Download last</GhostButton>
          </div>
        </Panel>
        <Panel title="Restore">
          <p className="text-sm text-muted-foreground">
            Select a snapshot to restore into a staging environment. Destructive restore is disabled
            in UI mock.
          </p>
          <select className="mt-3 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            <option>Nightly full — Aug 3</option>
            <option>Incremental — Aug 2</option>
          </select>
          <GhostButton className="mt-4">Preview restore plan</GhostButton>
        </Panel>
      </div>
    </PageScaffold>
  );
}
