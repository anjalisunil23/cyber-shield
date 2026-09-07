import { createFileRoute } from "@tanstack/react-router";
import { MOCK_RELATIONSHIPS } from "@/data/mock/platform";
import { PageScaffold, PrimaryButton, Panel } from "@/components/ui-kit/PageKit";
import { RelationshipCard } from "@/components/ui-kit/Cards";
import { useState } from "react";

export const Route = createFileRoute("/superior/relationships")({ component: Page });

function Page() {
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [items, setItems] = useState(MOCK_RELATIONSHIPS);
  return (
    <PageScaffold
      crumbs={[{ label: "Superior", to: "/superior/dashboard" }, { label: "Relationship Map" }]}
      title="Relationship Map"
      subtitle="Manual entity links (AI later)"
    >
      <Panel title="Add relationship">
        <form
          className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!source || !target) return;
            setItems((p) => [...p, { id: `r${Date.now()}`, source, target, type: "Manual" }]);
            setSource("");
            setTarget("");
          }}
        >
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Source"
            className="rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm"
          />
          <span className="grid place-items-center text-slate-500">→</span>
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Target"
            className="rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm"
          />
          <PrimaryButton type="submit">Link</PrimaryButton>
        </form>
      </Panel>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((r) => (
          <RelationshipCard key={r.id} source={r.source} target={r.target} type={r.type} />
        ))}
      </div>
    </PageScaffold>
  );
}
