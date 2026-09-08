import { createFileRoute, Link } from "@tanstack/react-router";
import { GhostButton, PageScaffold, Panel, PrimaryButton } from "@/components/ui-kit/PageKit";

export const Route = createFileRoute("/profile/edit")({ component: Page });

function Page() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground transition-colors">
      <div className="mx-auto max-w-xl">
        <PageScaffold
          crumbs={[{ label: "Profile", to: "/profile" }, { label: "Edit" }]}
          title="Edit Profile"
          actions={
            <Link to={"/profile" as "/"}>
              <GhostButton>Cancel</GhostButton>
            </Link>
          }
        >
          <Panel>
            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <input
                defaultValue="Alex Mercer"
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
              />
              <input
                defaultValue="Cyber Crime Unit"
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
              />
              <input
                defaultValue="+91 98765 11103"
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
              />
              <PrimaryButton type="submit">Save</PrimaryButton>
            </form>
          </Panel>
        </PageScaffold>
      </div>
    </div>
  );
}
