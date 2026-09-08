import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { UserCheck } from "lucide-react";
import {
  PageScaffold,
  Toolbar,
  useClientTable,
  Pagination,
  PrimaryButton,
} from "@/components/ui-kit/PageKit";
import { TaskCard } from "@/components/ui-kit/Cards";
import { useTaskList, deleteTaskItem } from "@/data/mock/platformState";
import { AssignTaskModal } from "@/components/superior/AssignTaskModal";

export const Route = createFileRoute("/superior/tasks")({ component: Page });

function Page() {
  const taskList = useTaskList();
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const table = useClientTable(taskList);

  const handleDeleteTask = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete task "${title}"?`)) {
      deleteTaskItem(id);
    }
  };

  return (
    <PageScaffold
      crumbs={[{ label: "Superior", to: "/superior/dashboard" }, { label: "Tasks" }]}
      title="Task Management & Assignment"
      subtitle="Assign, track, and manage investigator tasks"
      actions={
        <PrimaryButton onClick={() => setIsAssignModalOpen(true)}>
          <UserCheck className="mr-1.5 inline h-4 w-4" /> Assign New Task
        </PrimaryButton>
      }
    >
      <Toolbar search={table.search} onSearch={table.setSearch} />

      {table.rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No tasks assigned yet. Click "Assign New Task" above to assign a task to an investigator.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {table.rows.map((t) => (
            <TaskCard key={t.id} item={t} onDelete={() => handleDeleteTask(t.id, t.title)} />
          ))}
        </div>
      )}

      <Pagination page={table.page} pages={table.pages} onPage={table.setPage} />

      <AssignTaskModal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} />
    </PageScaffold>
  );
}
