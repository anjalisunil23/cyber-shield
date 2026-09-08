import { createFileRoute } from "@tanstack/react-router";
import { MOCK_TIMELINE } from "@/data/mock/platform";
import { PageScaffold, Panel, PrimaryButton } from "@/components/ui-kit/PageKit";
import { useState } from "react";

export const Route = createFileRoute("/superior/timeline")({ component: Page });

function Page() {
  const [events, setEvents] = useState(MOCK_TIMELINE);
  const [title, setTitle] = useState("");
  return (
    <PageScaffold
      crumbs={[{ label: "Superior", to: "/superior/dashboard" }, { label: "Timeline" }]}
      title="Timeline"
      subtitle="Chronological investigation events"
    >
      <Panel title="Add manual event">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            setEvents((prev) => [
              ...prev,
              {
                id: `tl-${Date.now()}`,
                title,
                detail: "Manual entry",
                at: new Date().toISOString().slice(0, 16).replace("T", " "),
                type: "manual",
              },
            ]);
            setTitle("");
          }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <PrimaryButton type="submit">Add</PrimaryButton>
        </form>
      </Panel>
      <ol className="mt-4 space-y-4">
        {events.map((t) => (
          <li key={t.id} className="relative border-l-2 border-primary/50 pl-4">
            <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-primary" />
            <p className="text-sm font-medium text-foreground">{t.title}</p>
            <p className="text-xs text-muted-foreground">{t.at}</p>
            <p className="text-sm text-muted-foreground">{t.detail}</p>
          </li>
        ))}
      </ol>
    </PageScaffold>
  );
}
