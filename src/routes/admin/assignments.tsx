import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  DataTable,
  ErrorState,
  LoadingBlock,
  PageScaffold,
  Panel,
  PrimaryButton,
  StatusPill,
} from "@/components/ui-kit/PageKit";
import { apiMessage } from "@/services/apiClient";
import { investigationApi } from "@/services/investigationApi";

export const Route = createFileRoute("/admin/assignments")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const [caseId, setCaseId] = useState("");
  const [superiorId, setSuperiorId] = useState("");
  const [investigatorId, setInvestigatorId] = useState("");

  const cases = useQuery({
    queryKey: ["admin-cases-assign"],
    queryFn: () => investigationApi.adminListCases({ page_size: 100 }),
  });
  const superiors = useQuery({
    queryKey: ["admin-superiors-assign"],
    queryFn: () => investigationApi.adminListUsers({ role: "superior_officer", page_size: 100 }),
  });
  const investigators = useQuery({
    queryKey: ["admin-investigators-assign"],
    queryFn: () => investigationApi.adminListUsers({ role: "investigator", page_size: 100 }),
  });

  const assign = useMutation({
    mutationFn: () =>
      investigationApi.adminAssignCase(caseId, {
        superior_officer_id: superiorId || undefined,
        investigator_ids: investigatorId ? [investigatorId] : [],
      }),
    onSuccess: () => {
      toast.success("Assignment saved");
      void qc.invalidateQueries({ queryKey: ["admin-cases"] });
      void qc.invalidateQueries({ queryKey: ["admin-cases-assign"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  return (
    <PageScaffold
      crumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Case Assignments" }]}
      title="Case Assignments"
      subtitle="Assign investigators to open cases"
    >
      <Panel title="Assign">
        <form
          className="grid gap-3 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!caseId) {
              toast.error("Select a case");
              return;
            }
            assign.mutate();
          }}
        >
          <select
            value={caseId}
            onChange={(e) => setCaseId(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm"
          >
            <option value="">Select case</option>
            {(cases.data?.items || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.case_number} — {c.title}
              </option>
            ))}
          </select>
          <select
            value={superiorId}
            onChange={(e) => setSuperiorId(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm"
          >
            <option value="">Superior Officer</option>
            {(superiors.data?.items || []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>
          <select
            value={investigatorId}
            onChange={(e) => setInvestigatorId(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm"
          >
            <option value="">Investigator</option>
            {(investigators.data?.items || []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>
          <PrimaryButton type="submit" className="sm:col-span-3">
            {assign.isPending ? "Assigning…" : "Assign"}
          </PrimaryButton>
        </form>
      </Panel>
      {cases.isLoading && <LoadingBlock />}
      {cases.isError && <ErrorState message={apiMessage(cases.error)} />}
      {!cases.isLoading && !cases.isError && (
        <DataTable
          rows={cases.data?.items || []}
          columns={[
            { key: "c", header: "Case", render: (r) => r.case_number },
            { key: "t", header: "Title", render: (r) => r.title },
            {
              key: "a",
              header: "Assignee",
              render: (r) =>
                r.superior_officer?.full_name ||
                r.investigators?.[0]?.full_name ||
                r.assignments?.[0]?.user?.full_name ||
                "—",
            },
            { key: "s", header: "Status", render: (r) => <StatusPill value={r.status} /> },
          ]}
        />
      )}
    </PageScaffold>
  );
}
