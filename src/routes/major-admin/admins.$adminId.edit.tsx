import { createFileRoute, Link } from "@tanstack/react-router";
import { MOCK_USERS } from "@/data/mock/platform";
import {
  PageScaffold,
  PrimaryButton,
  GhostButton,
  Panel,
  StatusPill,
} from "@/components/ui-kit/PageKit";

export const Route = createFileRoute("/major-admin/admins/$adminId/edit")({ component: Page });

function Page() {
  const { adminId } = Route.useParams();
  const user = MOCK_USERS.find((u) => u.id === adminId) || MOCK_USERS[0];
  return (
    <PageScaffold
      crumbs={[{ label: "Admins", to: "/major-admin/admins" }, { label: "Edit" }]}
      title={`Edit ${user.name}`}
      subtitle={user.email}
      actions={<StatusPill value={user.status} />}
    >
      <Panel>
        <form className="mx-auto grid max-w-2xl gap-4" onSubmit={(e) => e.preventDefault()}>
          <label className="text-xs text-slate-400">
            Full name
            <input
              defaultValue={user.name}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-slate-400">
            Department
            <input
              defaultValue={user.department}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-slate-400">
            Status
            <select
              defaultValue={user.status}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm"
            >
              <option>Active</option>
              <option>Suspended</option>
            </select>
          </label>
          <div className="flex gap-2">
            <PrimaryButton type="submit">Save changes</PrimaryButton>
            <Link to={"/major-admin/admins" as "/"}>
              <GhostButton>Back</GhostButton>
            </Link>
          </div>
        </form>
      </Panel>
    </PageScaffold>
  );
}
