import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ConfirmDialog,
  DataTable,
  ErrorState,
  LoadingBlock,
  Modal,
  PageScaffold,
  Pagination,
  PrimaryButton,
  SelectFilter,
  StatusPill,
  Toolbar,
  GhostButton,
} from "@/components/ui-kit/PageKit";
import { apiMessage } from "@/services/apiClient";
import { investigationApi } from "@/services/investigationApi";
import type { AdminCase, CasePriority, CaseStatus } from "@/services/types";

export const Route = createFileRoute("/admin/cases")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<AdminCase | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newPriority, setNewPriority] = useState<CasePriority>("medium");
  const [superiorId, setSuperiorId] = useState("");
  const [investigatorId, setInvestigatorId] = useState("");

  const params = useMemo(
    () => ({
      q: search || undefined,
      status: status === "All" ? undefined : status,
      priority: priority === "All" ? undefined : priority,
      page,
      page_size: 8,
    }),
    [search, status, priority, page],
  );

  const cases = useQuery({
    queryKey: ["admin-cases", params],
    queryFn: () => investigationApi.adminListCases(params),
  });
  const superiors = useQuery({
    queryKey: ["admin-superiors-opts"],
    queryFn: () => investigationApi.adminListUsers({ role: "superior_officer", page_size: 100 }),
  });
  const investigators = useQuery({
    queryKey: ["admin-investigators-opts"],
    queryFn: () => investigationApi.adminListUsers({ role: "investigator", page_size: 100 }),
  });

  const create = useMutation({
    mutationFn: () =>
      investigationApi.adminCreateCase({
        title,
        description: description || undefined,
        priority: newPriority,
        superior_officer_id: superiorId || undefined,
        investigator_ids: investigatorId ? [investigatorId] : [],
      }),
    onSuccess: () => {
      toast.success("Case created");
      setCreateOpen(false);
      setTitle("");
      setDescription("");
      void qc.invalidateQueries({ queryKey: ["admin-cases"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  const archive = useMutation({
    mutationFn: (id: string) => investigationApi.adminArchiveCase(id),
    onSuccess: () => {
      toast.success("Case archived");
      void qc.invalidateQueries({ queryKey: ["admin-cases"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => investigationApi.adminDeleteCase(id),
    onSuccess: () => {
      toast.success("Case deleted");
      setDeleteId(null);
      void qc.invalidateQueries({ queryKey: ["admin-cases"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CaseStatus }) =>
      investigationApi.adminUpdateCase(id, { status }),
    onSuccess: () => {
      toast.success("Status updated");
      void qc.invalidateQueries({ queryKey: ["admin-cases"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  return (
    <PageScaffold
      crumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Department Cases" }]}
      title="Department Cases"
      subtitle="Cases across your organization"
      actions={
        <div className="flex gap-2">
          <PrimaryButton onClick={() => setCreateOpen(true)}>Create case</PrimaryButton>
          <Link to={"/admin/assignments" as "/"}>
            <PrimaryButton>Case assignments</PrimaryButton>
          </Link>
        </div>
      }
    >
      <Toolbar
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        filters={
          <>
            <SelectFilter
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
              options={[
                "All",
                "open",
                "under_review",
                "evidence_collection",
                "analysis",
                "completed",
                "archived",
              ]}
            />
            <SelectFilter
              value={priority}
              onChange={(v) => {
                setPriority(v);
                setPage(1);
              }}
              options={["All", "low", "medium", "high", "critical"]}
            />
          </>
        }
      />
      {cases.isLoading && <LoadingBlock />}
      {cases.isError && <ErrorState message={apiMessage(cases.error)} />}
      {!cases.isLoading && !cases.isError && (
        <>
          <DataTable
            rows={cases.data?.items || []}
            columns={[
              {
                key: "c",
                header: "Case",
                render: (r) => (
                  <button type="button" className="text-cyan" onClick={() => setDetail(r)}>
                    {r.case_number}
                  </button>
                ),
              },
              { key: "t", header: "Title", render: (r) => r.title },
              { key: "p", header: "Priority", render: (r) => <StatusPill value={r.priority} /> },
              { key: "s", header: "Status", render: (r) => <StatusPill value={r.status} /> },
              {
                key: "a",
                header: "Assignee",
                render: (r) =>
                  r.superior_officer?.full_name ||
                  r.investigators?.[0]?.full_name ||
                  r.assignments?.[0]?.user?.full_name ||
                  "—",
              },
              {
                key: "x",
                header: "",
                render: (r) => (
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      className="text-amber-600 dark:text-amber-300 hover:underline"
                      onClick={() => archive.mutate(r.id)}
                    >
                      Archive
                    </button>
                    <button
                      type="button"
                      className="text-emerald-600 dark:text-emerald-300 hover:underline"
                      onClick={() => updateStatus.mutate({ id: r.id, status: "completed" })}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="text-rose-600 dark:text-rose-300 hover:underline"
                      onClick={() => setDeleteId(r.id)}
                    >
                      Delete
                    </button>
                  </div>
                ),
              },
            ]}
          />
          <Pagination
            page={cases.data?.page || 1}
            pages={cases.data?.pages || 1}
            onPage={setPage}
          />
        </>
      )}

      <Modal open={createOpen} title="Create Case" onClose={() => setCreateOpen(false)}>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <input
            required
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-24 rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as CasePriority)}
            className="rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="critical">critical</option>
          </select>
          <select
            value={superiorId}
            onChange={(e) => setSuperiorId(e.target.value)}
            className="rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Superior Officer (optional)</option>
            {(superiors.data?.items || []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>
          <select
            value={investigatorId}
            onChange={(e) => setInvestigatorId(e.target.value)}
            className="rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Investigator (optional)</option>
            {(investigators.data?.items || []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            <GhostButton onClick={() => setCreateOpen(false)}>Cancel</GhostButton>
            <PrimaryButton type="submit">{create.isPending ? "Creating…" : "Create"}</PrimaryButton>
          </div>
        </form>
      </Modal>

      <Modal open={!!detail} title={detail?.case_number || "Case"} onClose={() => setDetail(null)}>
        {detail && (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">{detail.title}</p>
            <p>{detail.description || "No description"}</p>
            <p>
              Priority: {detail.priority} · Status: {detail.status}
            </p>
            <p>Created: {new Date(detail.created_at).toLocaleString()}</p>
            <p>Superior: {detail.superior_officer?.full_name || "—"}</p>
            <p>
              Investigators:{" "}
              {(detail.investigators || []).map((i) => i.full_name).join(", ") || "—"}
            </p>
            <p>
              Evidence: {detail.evidence_count || 0} · Notes: {detail.notes_count || 0} · Timeline:{" "}
              {detail.timeline_count || 0}
            </p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete case?"
        message="This permanently removes the case and related records."
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove.mutate(deleteId)}
      />
    </PageScaffold>
  );
}
