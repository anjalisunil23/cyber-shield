import { createFileRoute, Link } from "@tanstack/react-router";
import { PageScaffold, PrimaryButton, GhostButton, Panel } from "@/components/ui-kit/PageKit";

export const Route = createFileRoute("/major-admin/admins/create")({ component: Page });

function Page() {
  return (
    <PageScaffold
      crumbs={[{ label: "Admins", to: "/major-admin/admins" }, { label: "Create" }]}
      title="Create Admin"
      subtitle="Provision a new organization Admin"
      actions={
        <Link to={"/major-admin/admins" as "/"}>
          <GhostButton>Cancel</GhostButton>
        </Link>
      }
    >
      <Panel>
        <form className="mx-auto grid max-w-2xl gap-4" onSubmit={(e) => e.preventDefault()}>
          {["Full name", "Email", "Phone", "Department", "Temporary password"].map((label) => (
            <label key={label} className="block text-xs text-slate-400">
              {label}
              <input className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm text-slate-100" />
            </label>
          ))}
          <PrimaryButton type="submit">Create Admin (UI)</PrimaryButton>
        </form>
      </Panel>
    </PageScaffold>
  );
}
