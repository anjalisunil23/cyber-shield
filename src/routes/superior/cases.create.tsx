import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GhostButton, PageScaffold, Panel, PrimaryButton } from "@/components/ui-kit/PageKit";
import { investigationApi } from "@/services/investigationApi";
import type { CasePriority, CaseStatus } from "@/services/types";
import type { MockCase } from "@/data/mock/platform";
import { addCaseItem } from "@/data/mock/platformState";
import { toast } from "sonner";
import { apiMessage } from "@/services/apiClient";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/superior/cases/create")({ component: Page });

function Page() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium" as CasePriority,
    status: "open" as CaseStatus,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Case title is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await investigationApi.createCase({
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        status: form.status,
        assignee_ids: [], // start unassigned
      });
      addCaseItem({
        id: res.id,
        caseNumber: res.case_number,
        title: res.title,
        description: res.description || undefined,
        priority: res.priority
          ? ((res.priority.charAt(0).toUpperCase() + res.priority.slice(1)) as MockCase["priority"])
          : "Medium",
        status: form.status,
      });
      toast.success("Case created successfully");
      void navigate({ to: "/superior/cases" });
    } catch (err) {
      toast.error(apiMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageScaffold
      crumbs={[{ label: "Cases", to: "/superior/cases" }, { label: "Create" }]}
      title="Create Case"
      subtitle="Open a new investigation case"
      actions={
        <Link to="/superior/cases">
          <GhostButton>Cancel</GhostButton>
        </Link>
      }
    >
      <Panel>
        <form className="mx-auto grid max-w-2xl gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400">Case Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Enter descriptive case title"
              className="rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm text-slate-100 focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400">Description</label>
            <textarea
              value={form.description}
              onChange={(prev) => setForm((p) => ({ ...p, description: prev.target.value }))}
              placeholder="Provide case background and scope details"
              rows={4}
              className="rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm text-slate-100 focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Priority</label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, priority: e.target.value as CasePriority }))
                }
                className="rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm text-slate-100 focus:border-purple-500 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Initial Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status: e.target.value as CaseStatus }))
                }
                className="rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm text-slate-100 focus:border-purple-500 focus:outline-none"
              >
                <option value="open">Open</option>
                <option value="under_review">Under Review</option>
                <option value="evidence_collection">Evidence Collection</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            onClick={handleSubmit}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 mt-2 flex items-center justify-center disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Case...
              </>
            ) : (
              "Create Case"
            )}
          </button>
        </form>
      </Panel>
    </PageScaffold>
  );
}
