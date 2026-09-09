import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiMessage } from "@/services/apiClient";
import { investigationApi } from "@/services/investigationApi";
import { apiClient } from "@/services/apiClient";

export const Route = createFileRoute("/dashboard/admin")({
  component: AdminPage,
});

function AdminPage() {
  const qc = useQueryClient();
  const usersQ = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => investigationApi.listUsers(),
  });
  const activityQ = useQuery({
    queryKey: ["admin-activity"],
    queryFn: () => investigationApi.activity(1),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      apiClient.patch(`/api/admin/users/${id}`, { is_active }).then((r) => r.data),
    onSuccess: () => {
      toast.success("User updated");
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => toast.error(apiMessage(e, "Admin only")),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">
          Manage users and review activity logs (admin role required)
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-x-auto shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(usersQ.data?.items || []).map(
              (u: {
                id: string;
                full_name: string;
                email: string;
                role: string;
                is_active?: boolean;
              }) => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="text-foreground font-medium">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-primary font-mono">{u.role}</td>
                  <td className="px-4 py-3 text-foreground">
                    {u.is_active === false ? "No" : "Yes"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="text-xs text-amber-600 dark:text-amber-400 font-medium hover:underline"
                      onClick={() =>
                        toggleActive.mutate({ id: u.id, is_active: u.is_active === false })
                      }
                    >
                      {u.is_active === false ? "Activate" : "Deactivate"}
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Activity logs</h3>
        <ul className="space-y-2">
          {(activityQ.data?.items || []).map((a) => (
            <li key={a.id} className="text-sm text-foreground/90">
              <span className="text-primary font-mono">{a.action}</span> — {a.description}
              <span className="ml-2 text-xs text-muted-foreground">
                {new Date(a.created_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
