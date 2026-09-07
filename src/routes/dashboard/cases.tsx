import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CaseTable } from "@/components/dashboard/CaseTable";
import { apiMessage } from "@/services/apiClient";
import { investigationApi } from "@/services/investigationApi";
import type { CasePriority, CaseStatus } from "@/services/types";

export const Route = createFileRoute("/dashboard/cases")({
  component: CasesPage,
});

const STATUSES: Array<CaseStatus | ""> = [
  "",
  "open",
  "under_review",
  "evidence_collection",
  "analysis",
  "completed",
  "archived",
];

function CasesPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState<CaseStatus | "">("");
  const [priority, setPriority] = useState<CasePriority | "">("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium" as CasePriority,
    status: "open" as CaseStatus,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["cases", status, priority, filter],
    queryFn: () =>
      investigationApi.listCases({
        q: filter || undefined,
        status: status || undefined,
        priority: priority || undefined,
        page_size: 50,
      }),
  });

  const create = useMutation({
    mutationFn: () => investigationApi.createCase(form),
    onSuccess: () => {
      toast.success("Case created");
      setOpen(false);
      setForm({ title: "", description: "", priority: "medium", status: "open" });
      void qc.invalidateQueries({ queryKey: ["cases"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Investigation Cases</h1>
          <p className="text-sm text-slate-400">
            Create, filter, assign, and track digital evidence cases
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New Case
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as CaseStatus | "")}
          className="rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-xs"
        >
          <option value="">All statuses</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as CasePriority | "")}
          className="rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-xs"
        >
          <option value="">All priorities</option>
          {(["low", "medium", "high", "critical"] as CasePriority[]).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search cases…"
          className="rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-xs"
        />
      </div>

      {isLoading && <p className="text-sm text-slate-400">Loading cases…</p>}
      {error && <p className="text-sm text-red-400">{apiMessage(error)}</p>}
      {data && <CaseTable rows={data.items} />}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <form
            className="w-full max-w-lg space-y-4 rounded-2xl border border-white/10 bg-[#0f172a] p-6 shadow-2xl"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <h2 className="text-lg font-semibold text-slate-50">Create case</h2>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Case title"
              className="w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-sm"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description"
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priority: e.target.value as CasePriority }))
                }
                className="rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-sm"
              >
                {(["low", "medium", "high", "critical"] as CasePriority[]).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as CaseStatus }))}
                className="rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-sm"
              >
                {STATUSES.filter(Boolean).map((s) => (
                  <option key={s} value={s}>
                    {s!.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={create.isPending}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {create.isPending ? "Creating…" : "Create"}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Or open an existing case from the table. Detail view:{" "}
              <Link to="/dashboard/cases" className="text-cyan">
                cases list
              </Link>
            </p>
          </form>
        </div>
      )}
    </div>
  );
}
