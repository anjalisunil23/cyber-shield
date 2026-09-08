import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { GhostButton, PageScaffold, Panel, PrimaryButton } from "@/components/ui-kit/PageKit";
import { apiMessage } from "@/services/apiClient";
import { investigationApi } from "@/services/investigationApi";

export const Route = createFileRoute("/admin/users/create")({ component: Page });

function Page() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [badge, setBadge] = useState("");
  const [role, setRole] = useState<"investigator" | "superior_officer">("investigator");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("Active");
  const [avatar, setAvatar] = useState<File | null>(null);

  const create = useMutation({
    mutationFn: async () => {
      const user = await investigationApi.adminCreateUser({
        full_name: fullName,
        email,
        phone: phone || undefined,
        badge_number: badge || undefined,
        role,
        password,
        confirm_password: confirm,
        is_active: status === "Active",
      });
      if (avatar) await investigationApi.adminUploadAvatar(user.id, avatar);
      return user;
    },
    onSuccess: () => {
      toast.success("User created");
      void navigate({ to: "/admin/users" });
    },
    onError: (e) => toast.error(apiMessage(e)),
  });

  return (
    <PageScaffold
      crumbs={[{ label: "Users", to: "/admin/users" }, { label: "Create" }]}
      title="Create User"
      subtitle="Add Superior Officer or Investigator"
      actions={
        <Link to={"/admin/users" as "/"}>
          <GhostButton>Cancel</GhostButton>
        </Link>
      }
    >
      <Panel>
        <form
          className="mx-auto grid max-w-xl gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <input
            required
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            required
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            placeholder="Badge number"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            className="rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "investigator" | "superior_officer")}
            className="rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="investigator">Investigator</option>
            <option value="superior_officer">Superior Officer</option>
          </select>
          <input
            required
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            required
            placeholder="Confirm password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
          <PrimaryButton type="submit">{create.isPending ? "Creating…" : "Create"}</PrimaryButton>
        </form>
      </Panel>
    </PageScaffold>
  );
}
