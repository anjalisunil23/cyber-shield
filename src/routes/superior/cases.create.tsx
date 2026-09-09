import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GhostButton, PageScaffold, Panel, PrimaryButton } from "@/components/ui-kit/PageKit";
import { investigationApi } from "@/services/investigationApi";
import type { CasePriority, CaseStatus } from "@/services/types";
import type { MockCase } from "@/data/mock/platform";
import { addCaseItem } from "@/data/mock/platformState";
import { toast } from "sonner";
import { apiMessage } from "@/services/apiClient";
import { Loader2, ShieldAlert, UserCheck } from "lucide-react";
import { MOCK_USERS } from "@/data/mock/platform";

export const Route = createFileRoute("/superior/cases/create")({ component: Page });

function Page() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [availableInvestigators, setAvailableInvestigators] = useState<
    { id: string; name: string; email: string; role?: string }[]
  >([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium" as CasePriority,
    status: "open" as CaseStatus,
  });

  useEffect(() => {
    // Load active investigators from backend
    investigationApi
      .adminListUsers({ page_size: 100 })
      .then((res) => {
        if (res.items) {
          const invs = res.items
            .filter((u) => u.is_active !== false && u.role === "investigator")
            .map((u) => ({ id: u.id, name: u.full_name, email: u.email, role: u.role }));
          setAvailableInvestigators(invs);
          if (invs.length > 0) {
            setSelectedLeadId((prev) => prev || invs[0].id);
          }
        }
      })
      .catch(() => {
        // Fallback to mock investigators
        const fallback = MOCK_USERS.filter((u) => u.role === "Investigator").map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
        }));
        setAvailableInvestigators(fallback);
        if (fallback.length > 0) {
          setSelectedLeadId((prev) => prev || fallback[0].id);
        }
      });
  }, []);

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
        investigator_lead_id: selectedLeadId || undefined,
        assignee_ids: selectedLeadId ? [selectedLeadId] : [],
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
      toast.success("Case created and Investigator Lead assigned successfully!");
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
      subtitle="Open a new investigation case and assign the initial Investigator Lead"
      actions={
        <Link to="/superior/cases">
          <GhostButton>Cancel</GhostButton>
        </Link>
      }
    >
      <Panel>
        <form className="mx-auto grid max-w-2xl gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Case Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Enter descriptive case title"
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Description</label>
            <textarea
              value={form.description}
              onChange={(prev) => setForm((p) => ({ ...p, description: prev.target.value }))}
              placeholder="Provide case background and scope details"
              rows={4}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Initial Investigator Assignment -> Automatically becomes Investigator Lead */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <UserCheck className="h-4 w-4 text-primary" />
              <span>Initial Assigned Investigator (Investigator Lead)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              The assigned investigator automatically becomes the{" "}
              <strong className="text-foreground">Investigator Lead</strong> who will manage the
              case investigation team and communication group.
            </p>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">-- Select Investigator Lead (or assign later) --</option>
              {availableInvestigators.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.name} ({inv.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Priority</label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, priority: e.target.value as CasePriority }))
                }
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Initial Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status: e.target.value as CaseStatus }))
                }
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
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
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 mt-2 flex items-center justify-center disabled:opacity-60 transition-colors shadow-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Case...
              </>
            ) : (
              "Create Case & Establish Lead"
            )}
          </button>
        </form>
      </Panel>
    </PageScaffold>
  );
}
