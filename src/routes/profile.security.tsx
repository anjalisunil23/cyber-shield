import { createFileRoute, Link } from "@tanstack/react-router";
import { GhostButton, PageScaffold, Panel, PrimaryButton } from "@/components/ui-kit/PageKit";

export const Route = createFileRoute("/profile/security")({ component: Page });

function Page() {
  return (
    <div className="min-h-screen bg-[#020617] px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-xl">
        <PageScaffold
          crumbs={[{ label: "Profile", to: "/profile" }, { label: "Security" }]}
          title="Change Password"
          actions={
            <Link to={"/profile" as "/"}>
              <GhostButton>Back</GhostButton>
            </Link>
          }
        >
          <Panel>
            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <input
                type="password"
                placeholder="Current password"
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm"
              />
              <input
                type="password"
                placeholder="New password"
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm"
              />
              <input
                type="password"
                placeholder="Confirm password"
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm"
              />
              <PrimaryButton type="submit">Update password</PrimaryButton>
            </form>
          </Panel>
        </PageScaffold>
      </div>
    </div>
  );
}
