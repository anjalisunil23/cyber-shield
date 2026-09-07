import { createFileRoute } from "@tanstack/react-router";
import { PageScaffold, Panel } from "@/components/ui-kit/PageKit";

export const Route = createFileRoute("/help")({ component: Page });

const FAQS = [
  [
    "How do I upload evidence?",
    "Open Upload Evidence, select a case, then drag files into the dropzone.",
  ],
  ["Who can create admins?", "Only Major Admin can create Admin accounts."],
  ["Are AI features available?", "Not in Phase 1 — placeholders are shown across dashboards."],
];

function Page() {
  return (
    <div className="min-h-screen bg-[#020617] px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <PageScaffold
          crumbs={[{ label: "App" }, { label: "Help Center" }]}
          title="Help Center"
          subtitle="Guides for investigators and admins"
        >
          <div className="space-y-3">
            {FAQS.map(([q, a]) => (
              <Panel key={q} title={q}>
                <p className="text-sm text-slate-400">{a}</p>
              </Panel>
            ))}
          </div>
        </PageScaffold>
      </div>
    </div>
  );
}
