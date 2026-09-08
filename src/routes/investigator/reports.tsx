import { createFileRoute } from "@tanstack/react-router";
import { MOCK_CASES, MOCK_REPORTS } from "@/data/mock/platform";
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

export const Route = createFileRoute("/investigator/reports")({ component: Page });

function Page() {
  const table = useClientTable(MOCK_REPORTS);
  const [draft, setDraft] = useState(false);

  return (
    <PageScaffold
      crumbs={[
        { label: "Investigator", to: "/investigator/dashboard" },
        { label: "Generate Report" },
      ]}
      title="Generate Report"
      subtitle="Draft investigation summaries"
    >
      <Panel title="New draft">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setDraft(true);
          }}
        >
          <select className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60">
            {MOCK_CASES.map((c) => (
              <option key={c.id}>{c.caseNumber}</option>
            ))}
          </select>
          <PrimaryButton type="submit">Generate draft</PrimaryButton>
        </form>
      </Panel>
      {draft && (
        <Panel title="Draft preview" className="mt-4">
          <p className="text-sm text-foreground">
            Draft report body (mock). Ready for superior review.
          </p>
          <PrimaryButton className="mt-3" onClick={() => window.print()}>
            Print view
          </PrimaryButton>
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
