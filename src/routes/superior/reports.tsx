import { createFileRoute } from "@tanstack/react-router";
import { MOCK_REPORTS, MOCK_CASES } from "@/data/mock/platform";
import {
  PageScaffold,
  Panel,
  PrimaryButton,
  Toolbar,
  useClientTable,
  Pagination,
} from "@/components/ui-kit/PageKit";
import { ReportCard } from "@/components/ui-kit/Cards";
import { useState } from "react";

export const Route = createFileRoute("/superior/reports")({ component: Page });

function Page() {
  const table = useClientTable(MOCK_REPORTS);
  const [preview, setPreview] = useState(false);
  return (
    <PageScaffold
      crumbs={[{ label: "Superior", to: "/superior/dashboard" }, { label: "Reports" }]}
      title="Reports"
      subtitle="Generate, preview, print"
    >
      <Panel title="Generate report">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setPreview(true);
          }}
        >
          <select className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground">
            {MOCK_CASES.map((c) => (
              <option key={c.id}>{c.caseNumber}</option>
            ))}
          </select>
          <select className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground">
            <option>HTML</option>
            <option>PDF</option>
            <option>CSV</option>
          </select>
          <PrimaryButton type="submit">Generate</PrimaryButton>
        </form>
      </Panel>
      {preview && (
        <Panel title="Report preview" className="mt-4">
          <p className="text-sm text-muted-foreground">
            Investigation Summary — mock content suitable for print/PDF export.
          </p>
          <div className="mt-3 flex gap-2">
            <PrimaryButton onClick={() => window.print()}>Print / PDF</PrimaryButton>
          </div>
        </Panel>
      )}
      <div className="mt-4" />
      <Toolbar search={table.search} onSearch={table.setSearch} />
      <div className="grid gap-3 sm:grid-cols-2">
        {table.rows.map((r) => (
          <ReportCard key={r.id} {...r} />
        ))}
      </div>
      <Pagination page={table.page} pages={table.pages} onPage={table.setPage} />
    </PageScaffold>
  );
}
