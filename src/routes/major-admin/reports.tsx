import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MOCK_REPORTS } from "@/data/mock/platform";
import {
  PageScaffold,
  Toolbar,
  useClientTable,
  Pagination,
  EmptyState,
} from "@/components/ui-kit/PageKit";
import { ReportCard } from "@/components/ui-kit/Cards";

export const Route = createFileRoute("/major-admin/reports")({ component: Page });

function Page() {
  const table = useClientTable(MOCK_REPORTS);
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <PageScaffold
      crumbs={[{ label: "Major Admin", to: "/major-admin/dashboard" }, { label: "System Reports" }]}
      title="System Reports"
      subtitle="Platform investigation report library"
    >
      <Toolbar search={table.search} onSearch={table.setSearch} />
      {!table.rows.length ? (
        <EmptyState />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {table.rows.map((r) => (
            <ReportCard
              key={r.id}
              title={r.title}
              format={r.format}
              author={r.author}
              created={r.created}
              onPreview={() => setPreview(r.title)}
            />
          ))}
        </div>
      )}
      <Pagination page={table.page} pages={table.pages} onPage={table.setPage} />
      {preview && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold text-foreground">Preview — {preview}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Print-friendly mock report body. Export PDF / Print are UI-only.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors"
            >
              Export PDF
            </button>
            <button
              type="button"
              className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              onClick={() => window.print()}
            >
              Print
            </button>
          </div>
        </div>
      )}
    </PageScaffold>
  );
}
