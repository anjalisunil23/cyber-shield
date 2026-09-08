import { createFileRoute } from "@tanstack/react-router";
import { MOCK_TIMELINE } from "@/data/mock/platform";
import { PageScaffold } from "@/components/ui-kit/PageKit";

export const Route = createFileRoute("/investigator/timeline")({ component: Page });

function Page() {
  return (
    <PageScaffold
      crumbs={[{ label: "Investigator", to: "/investigator/dashboard" }, { label: "Timeline" }]}
      title="Timeline"
      subtitle="Case chronology"
    >
      <ol className="space-y-4">
        {MOCK_TIMELINE.map((t) => (
          <li key={t.id} className="relative border-l border-border pl-4">
            <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-primary" />
            <p className="text-sm font-semibold text-foreground">{t.title}</p>
            <p className="text-xs text-muted-foreground">{t.at}</p>
            <p className="text-sm text-muted-foreground">{t.detail}</p>
          </li>
        ))}
      </ol>
    </PageScaffold>
  );
}
