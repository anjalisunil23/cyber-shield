import { createFileRoute } from "@tanstack/react-router";
import { MOCK_TASKS } from "@/data/mock/platform";
import { PageScaffold, Toolbar, useClientTable, Pagination } from "@/components/ui-kit/PageKit";
import { TaskCard } from "@/components/ui-kit/Cards";

export const Route = createFileRoute("/investigator/tasks")({ component: Page });

function Page() {
  const table = useClientTable(MOCK_TASKS);
  return (
    <PageScaffold
      crumbs={[{ label: "Investigator", to: "/investigator/dashboard" }, { label: "Tasks" }]}
      title="Tasks"
      subtitle="Pending investigative work"
    >
      <Toolbar search={table.search} onSearch={table.setSearch} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {table.rows.map((t) => (
          <TaskCard key={t.id} item={t} />
        ))}
      </div>
      <Pagination page={table.page} pages={table.pages} onPage={table.setPage} />
    </PageScaffold>
  );
}
