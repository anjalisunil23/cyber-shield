import { useEffect, useState } from "react";
import { UserCheck, X } from "lucide-react";
import { PrimaryButton, GhostButton } from "@/components/ui-kit/PageKit";
import { addTaskItem, useCaseList } from "@/data/mock/platformState";
import { MOCK_USERS, MockTask } from "@/data/mock/platform";
import { investigationApi } from "@/services/investigationApi";

export function AssignTaskModal({
  isOpen,
  onClose,
  defaultInvestigator,
  defaultCaseNumber,
  onAssigned,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultInvestigator?: string;
  defaultCaseNumber?: string;
  onAssigned?: (task: MockTask) => void;
}) {
  const storedCases = useCaseList();
  const [apiCases, setApiCases] = useState<{ id: string; caseNumber: string; title: string }[]>([]);
  const [apiInvestigators, setApiInvestigators] = useState<
    { id: string; name: string; role: string; email: string }[]
  >([]);

  useEffect(() => {
    if (!isOpen) return;

    investigationApi
      .listCases({ page_size: 100 })
      .then((res) => {
        if (res.items) {
          setApiCases(
            res.items.map((c) => ({ id: c.id, caseNumber: c.case_number, title: c.title })),
          );
        }
      })
      .catch(() => {});

    investigationApi
      .adminListUsers({ page_size: 100 })
      .then((res) => {
        if (res.items) {
          setApiInvestigators(
            res.items
              .filter((u) => u.is_active !== false)
              .map((u) => ({
                id: u.id,
                name: u.full_name,
                role: u.role === "superior_officer" ? "Superior Officer" : "Investigator",
                email: u.email,
              })),
          );
        }
      })
      .catch(() => {});
  }, [isOpen]);

  const mockInvestigators = MOCK_USERS.map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    email: u.email,
  }));
  const combinedInvestigators = [...apiInvestigators];
  for (const mu of mockInvestigators) {
    if (
      !combinedInvestigators.some(
        (u) => u.name.toLowerCase() === mu.name.toLowerCase() || u.id === mu.id,
      )
    ) {
      combinedInvestigators.push(mu);
    }
  }

  const investigatorOptions =
    combinedInvestigators.length > 0 ? combinedInvestigators : mockInvestigators;

  const combinedCases = [...apiCases];
  for (const sc of storedCases) {
    if (!combinedCases.some((c) => c.caseNumber === sc.caseNumber || c.id === sc.id)) {
      combinedCases.push({ id: sc.id, caseNumber: sc.caseNumber, title: sc.title });
    }
  }
  const caseOptions = combinedCases.length > 0 ? combinedCases : storedCases;

  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState(
    defaultInvestigator || investigatorOptions[0]?.name || "Alex Mercer",
  );
  const [caseNumber, setCaseNumber] = useState(defaultCaseNumber || "CS-2026-0142");
  const [dueDate, setDueDate] = useState("2026-08-10");
  const [priority, setPriority] = useState("High");

  useEffect(() => {
    if (defaultInvestigator) {
      setAssignee(defaultInvestigator);
    } else if (investigatorOptions.length > 0 && !assignee) {
      setAssignee(investigatorOptions[0].name);
    }
  }, [defaultInvestigator, investigatorOptions]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created = addTaskItem({
      title: title.trim() || "Investigation follow-up",
      caseNumber,
      due: dueDate,
      status: "Open",
      assignee,
      priority,
    });

    if (onAssigned) onAssigned(created);
    onClose();
    setTitle("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f172a] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-cyan/20 text-cyan">
              <UserCheck className="h-4 w-4" />
            </div>
            <h3 className="text-base font-semibold text-slate-100">Assign Task to Investigator</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400">Target Investigator</label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm text-slate-100 focus:border-cyan focus:outline-none"
            >
              {investigatorOptions.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name} ({u.role} — {u.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400">
              Task Title / Instructions
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Extract CDN server logs for IP correlation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400">Target Case</label>
              <select
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm text-slate-100 focus:border-cyan focus:outline-none"
              >
                {caseOptions.map((c) => (
                  <option key={c.id} value={c.caseNumber}>
                    {c.caseNumber} - {c.title.length > 25 ? `${c.title.slice(0, 25)}...` : c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm text-slate-100 focus:border-cyan focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400">Task Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm text-slate-100 focus:border-cyan focus:outline-none"
            >
              <option value="Low">Low Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="High">High Priority</option>
              <option value="Critical">Critical Priority</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <GhostButton type="button" onClick={onClose}>
              Cancel
            </GhostButton>
            <PrimaryButton type="submit">Assign Task</PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
