import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { UserCheck, CheckCircle2 } from "lucide-react";
import { MOCK_USERS } from "@/data/mock/platform";
import { GhostButton, PageScaffold, Panel, PrimaryButton } from "@/components/ui-kit/PageKit";
import { useCaseList, assignCaseToInvestigator, addTaskItem } from "@/data/mock/platformState";
import { investigationApi } from "@/services/investigationApi";

export const Route = createFileRoute("/superior/cases/$caseId/assign")({ component: Page });

function Page() {
  const { caseId } = Route.useParams();
  const cases = useCaseList();
  const navigate = useNavigate();

  const c = cases.find((x) => x.id === caseId || x.caseNumber === caseId) || cases[0];
  const [apiUsers, setApiUsers] = useState<{ id: string; name: string; email: string }[]>([]);

  useEffect(() => {
    investigationApi
      .adminListUsers({ page_size: 100 })
      .then((res) => {
        if (res.items) {
          setApiUsers(
            res.items
              .filter((u) => u.is_active !== false)
              .map((u) => ({ id: u.id, name: u.full_name, email: u.email })),
          );
        }
      })
      .catch(() => {});
  }, []);

  const mockUsers = MOCK_USERS.map((u) => ({ id: u.id, name: u.name, email: u.email }));
  const combinedUsers = [...apiUsers];
  for (const mu of mockUsers) {
    if (
      !combinedUsers.some((u) => u.name.toLowerCase() === mu.name.toLowerCase() || u.id === mu.id)
    ) {
      combinedUsers.push(mu);
    }
  }
  const investigatorOptions = combinedUsers.length > 0 ? combinedUsers : mockUsers;

  const [selectedInvestigator, setSelectedInvestigator] = useState(
    c.assignee || investigatorOptions[0]?.name || "Alex Mercer",
  );
  const [taskInstructions, setTaskInstructions] = useState("");
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (c.assignee) {
      setSelectedInvestigator(c.assignee);
    } else if (investigatorOptions.length > 0 && !selectedInvestigator) {
      setSelectedInvestigator(investigatorOptions[0].name);
    }
  }, [c.assignee, investigatorOptions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    assignCaseToInvestigator(c.id, selectedInvestigator);

    if (taskInstructions.trim()) {
      addTaskItem({
        title: taskInstructions.trim(),
        caseNumber: c.caseNumber,
        due: "2026-08-15",
        status: "Open",
        assignee: selectedInvestigator,
        priority: "High",
      });
    }

    setSuccessMsg(true);
    setTimeout(() => {
      navigate({ to: "/superior/cases/$caseId", params: { caseId: c.id } });
    }, 1200);
  };

  return (
    <PageScaffold
      crumbs={[
        { label: c.caseNumber, to: `/superior/cases/${c.id}` },
        { label: "Assign Investigator & Tasks" },
      ]}
      title={`Assign Investigator — ${c.caseNumber}`}
      subtitle={c.title}
    >
      <Panel className="mx-auto max-w-lg">
        {successMsg ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-emerald-400">
            <CheckCircle2 className="mb-2 h-10 w-10 animate-bounce" />
            <p className="text-base font-semibold">Investigator & Task Assigned Successfully!</p>
            <p className="mt-1 text-xs text-slate-400">Redirecting to case details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400">
                Select Investigator
              </label>
              <select
                value={selectedInvestigator}
                onChange={(e) => setSelectedInvestigator(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm text-slate-100 focus:border-cyan focus:outline-none"
              >
                {investigatorOptions.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} — {u.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400">
                Assignment Note / Task Instructions (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Conduct forensic imaging of hard drives and cross-reference PII records."
                value={taskInstructions}
                onChange={(e) => setTaskInstructions(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <PrimaryButton type="submit">
                <UserCheck className="mr-1.5 inline h-4 w-4" /> Confirm Assignment
              </PrimaryButton>
              <Link to={"/superior/cases/$caseId" as "/"} params={{ caseId: c.id } as never}>
                <GhostButton type="button">Cancel</GhostButton>
              </Link>
            </div>
          </form>
        )}
      </Panel>
    </PageScaffold>
  );
}
