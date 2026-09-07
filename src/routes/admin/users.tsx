import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ConfirmDialog,
  DataTable,
  ErrorState,
  LoadingBlock,
  PageScaffold,
  Pagination,
  PrimaryButton,
  SelectFilter,
  StatusPill,
  Toolbar,
} from "@/components/ui-kit/PageKit";
import { apiMessage } from "@/services/apiClient";
import { investigationApi } from "@/services/investigationApi";
import type { AdminUser } from "@/services/types";

export const Route = createFileRoute("/admin/users")({ component: Page });

function roleLabel(role: string) {
  if (role === "superior_officer") return "Superior Officer";
  if (role === "investigator") return "Investigator";
  return role;
}

function Page() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("All");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState<{
    id: string;
    action: "delete" | "suspend" | "activate";
  } | null>(null);

  const params = useMemo(
    () => ({
      q: search || undefined,
      role: role === "All" ? undefined : role,
      is_active: status === "All" ? undefined : status === "Active",
      page,
      page_size: 8,
    }),
    [search, role, status, page],
  );

  const users = useQuery({
    queryKey: ["admin-users", params],
    queryFn: () => investigationApi.adminListUsers(params),
  });

  const mutate = useMutation({
    mutationFn: async () => {
      if (!confirm) return;
      if (confirm.action === "delete") return investigationApi.adminDeleteUser(confirm.id);
      if (confirm.action === "suspend") return investigationApi.adminSuspendUser(confirm.id);
      return investigationApi.adminActivateUser(confirm.id);
    },
    onSuccess: () => {
      toast.success("User updated");
      setConfirm(null);
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  const rows: AdminUser[] = users.data?.items || [];

  return (
    <PageScaffold
      crumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Users" }]}
      title="Users"
      subtitle="Organization directory"
      actions={
        <Link to={"/admin/users/create" as "/"}>
          <PrimaryButton>Create user</PrimaryButton>
        </Link>
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
              value={role}
              onChange={(v) => {
                setRole(v);
                setPage(1);
              }}
              options={["All", "superior_officer", "investigator"]}
            />
            <SelectFilter
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
              options={["All", "Active", "Suspended"]}
            />
          </>
        }
      />
      {users.isLoading && <LoadingBlock />}
      {users.isError && <ErrorState message={apiMessage(users.error)} />}
      {!users.isLoading && !users.isError && (
        <>
          <DataTable
            rows={rows}
            columns={[
              { key: "n", header: "Name", render: (r) => r.full_name },
              { key: "e", header: "Email", render: (r) => r.email },
              { key: "r", header: "Role", render: (r) => roleLabel(r.role) },
              {
                key: "s",
                header: "Status",
                render: (r) => <StatusPill value={r.is_active ? "Active" : "Suspended"} />,
              },
              {
                key: "a",
                header: "",
                render: (r) => (
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Link
                      to={"/admin/users/$userId/edit" as "/"}
                      params={{ userId: r.id } as never}
                      className="text-cyan"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="text-amber-300"
                      onClick={() =>
                        setConfirm({ id: r.id, action: r.is_active ? "suspend" : "activate" })
                      }
                    >
                      {r.is_active ? "Suspend" : "Activate"}
                    </button>
                    <button
                      type="button"
                      className="text-rose-300"
                      onClick={() => setConfirm({ id: r.id, action: "delete" })}
                    >
                      Delete
                    </button>
                  </div>
                ),
              },
            ]}
          />
          <Pagination
            page={users.data?.page || 1}
            pages={users.data?.pages || 1}
            onPage={setPage}
          />
        </>
      )}
      <ConfirmDialog
        open={!!confirm}
        title={
          confirm?.action === "delete"
            ? "Delete user?"
            : confirm?.action === "suspend"
              ? "Suspend user?"
              : "Activate user?"
        }
        message="This action applies to your department directory only."
        onClose={() => setConfirm(null)}
        onConfirm={() => mutate.mutate()}
      />
    </PageScaffold>
  );
}
