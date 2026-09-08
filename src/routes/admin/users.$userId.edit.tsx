import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ConfirmDialog,
  GhostButton,
  LoadingBlock,
  PageScaffold,
  Panel,
  PrimaryButton,
} from "@/components/ui-kit/PageKit";
import { apiMessage } from "@/services/apiClient";
import { investigationApi } from "@/services/investigationApi";

export const Route = createFileRoute("/admin/users/$userId/edit")({ component: Page });

function Page() {
  const { userId } = Route.useParams();
  const qc = useQueryClient();
  const user = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: () => investigationApi.adminGetUser(userId),
  });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [badge, setBadge] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("Active");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);

  useEffect(() => {
    if (!user.data) return;
    setFullName(user.data.full_name);
    setPhone(user.data.phone || "");
    setBadge(user.data.badge_number || "");
    setDepartment(user.data.department || "");
    setStatus(user.data.is_active ? "Active" : "Suspended");
  }, [user.data]);

  const save = useMutation({
    mutationFn: async () => {
      const updated = await investigationApi.adminUpdateUser(userId, {
        full_name: fullName,
        phone: phone || null,
        badge_number: badge || null,
        department: department || null,
        is_active: status === "Active",
      });
      if (avatar) await investigationApi.adminUploadAvatar(userId, avatar);
      if (newPassword) {
        await investigationApi.adminResetPassword(userId, newPassword, confirmPassword);
      }
      return updated;
    },
    onSuccess: () => {
      toast.success("User saved");
      void qc.invalidateQueries({ queryKey: ["admin-user", userId] });
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  const remove = useMutation({
    mutationFn: () => investigationApi.adminDeleteUser(userId),
    onSuccess: () => {
      toast.success("User deleted");
      window.location.href = "/admin/users";
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  if (user.isLoading) {
    return (
      <PageScaffold
        crumbs={[{ label: "Users", to: "/admin/users" }, { label: "Edit" }]}
        title="Edit User"
      >
        <LoadingBlock />
      </PageScaffold>
    );
  }

  if (user.isError || !user.data) {
    return (
      <PageScaffold
        crumbs={[{ label: "Users", to: "/admin/users" }, { label: "Edit" }]}
        title="Edit User"
      >
        <p className="text-sm text-rose-500 dark:text-rose-300">{apiMessage(user.error, "User not found")}</p>
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      crumbs={[{ label: "Users", to: "/admin/users" }, { label: "Edit" }]}
      title={`Edit ${user.data.full_name}`}
      subtitle={user.data.email}
    >
      <Panel>
        <form
          className="mx-auto grid max-w-xl gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
            className="rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            placeholder="Badge number"
            className="rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option>Active</option>
            <option>Suspended</option>
          </select>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAvatar(e.target.files?.[0] || null)}
            className="rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="password"
            placeholder="Reset password (optional)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex flex-wrap gap-2">
            <PrimaryButton type="submit">{save.isPending ? "Saving…" : "Save"}</PrimaryButton>
            <Link to={"/admin/users" as "/"}>
              <GhostButton>Back</GhostButton>
            </Link>
            <GhostButton
              className="border-rose-500/30 text-rose-600 hover:bg-rose-500/10 dark:text-rose-300"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </GhostButton>
          </div>
        </form>
      </Panel>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete user?"
        message="This permanently removes the user from your department."
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => remove.mutate()}
      />
    </PageScaffold>
  );
}
