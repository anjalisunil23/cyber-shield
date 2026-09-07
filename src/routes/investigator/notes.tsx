import { createFileRoute } from "@tanstack/react-router";
import { MOCK_NOTES } from "@/data/mock/platform";
import {
  PageScaffold,
  Panel,
  PrimaryButton,
  Toolbar,
  useClientTable,
  Pagination,
} from "@/components/ui-kit/PageKit";
import { useState } from "react";
import { Pin } from "lucide-react";

export const Route = createFileRoute("/investigator/notes")({ component: Page });

function Page() {
  const [notes, setNotes] = useState(MOCK_NOTES);
  const table = useClientTable(notes);
  const [body, setBody] = useState("");
  return (
    <PageScaffold
      crumbs={[{ label: "Investigator", to: "/investigator/dashboard" }, { label: "Notes" }]}
      title="Notes"
      subtitle="Markdown-friendly investigation notes"
    >
      <Panel title="Add note">
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!body.trim()) return;
            setNotes((p) => [
              {
                id: `n${Date.now()}`,
                title: "Note",
                body,
                caseNumber: "CS-2026-0142",
                author: "You",
                pinned: false,
                updatedAt: "Today",
              },
              ...p,
            ]);
            setBody("");
          }}
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Write a note…"
            className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm"
          />
          <PrimaryButton type="submit">Save note</PrimaryButton>
        </form>
      </Panel>
      <div className="mt-4" />
      <Toolbar search={table.search} onSearch={table.setSearch} />
      <div className="space-y-3">
        {table.rows.map((n) => (
          <div key={n.id} className="rounded-2xl border border-white/10 bg-[#111827]/90 p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span>
                {n.author} · {n.caseNumber} · {n.updatedAt}
              </span>
              {n.pinned && <Pin className="h-3.5 w-3.5 text-cyan" />}
            </div>
            <p className="text-sm font-medium text-slate-100">{n.title}</p>
            <pre className="mt-1 whitespace-pre-wrap font-sans text-sm text-slate-400">
              {n.body}
            </pre>
          </div>
        ))}
      </div>
      <Pagination page={table.page} pages={table.pages} onPage={table.setPage} />
    </PageScaffold>
  );
}
