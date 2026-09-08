import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { PrimaryButton, GhostButton } from "@/components/ui-kit/PageKit";

export const Route = createFileRoute("/unauthorized")({ component: Page });

function Page() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 text-center text-foreground transition-colors">
      <div>
        <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-amber-500" />
        <h1 className="text-3xl font-bold">403 — Unauthorized</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view this workspace.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to={"/login" as "/"}>
            <PrimaryButton>Login</PrimaryButton>
          </Link>
          <Link to="/">
            <GhostButton>Home</GhostButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
