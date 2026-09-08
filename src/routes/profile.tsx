import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageScaffold, Panel, PrimaryButton } from "@/components/ui-kit/PageKit";
import { investigationApi } from "@/services/investigationApi";
import { clearToken } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/profile")({ component: Page });

function Page() {
  const [user, setUser] = useState<{
    full_name: string;
    email: string;
    role: string;
    department: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    investigationApi
      .me()
      .then((data) => {
        setUser(data);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSignOut = () => {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground transition-colors sm:px-8">
      <div className="mx-auto max-w-4xl">
        <PageScaffold
          crumbs={[{ label: "Home", to: "/" }, { label: "Profile" }]}
          title="User Profile"
          subtitle="View and edit your account settings"
          actions={
            <Link to="/profile/edit" className="text-sm font-semibold text-primary hover:underline">
              Edit profile
            </Link>
          }
        >
          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row items-center gap-4 shadow-xs">
            <div className="h-16 w-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xl font-bold text-primary shadow-xs">
              {user?.full_name?.charAt(0) || "U"}
            </div>
            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-lg font-bold text-foreground">{user?.full_name || "Agent"}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-1">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/25">
                  {user?.role}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                  {user?.department || "General Unit"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Panel title="Security & Notifications">
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/profile/edit" className="text-primary hover:underline font-medium">
                    Edit Account Details
                  </Link>
                </li>
                <li>
                  <Link to="/profile/security" className="text-primary hover:underline font-medium">
                    Change Password
                  </Link>
                </li>
                <li>
                  <Link to="/notifications" className="text-primary hover:underline font-medium">
                    System Alerts Center
                  </Link>
                </li>
              </ul>
            </Panel>
            <Panel title="Session Management">
              <p className="text-sm text-muted-foreground">
                Signed in via secure JWT token authentication.
              </p>
              <PrimaryButton onClick={handleSignOut} className="mt-3">
                Sign Out
              </PrimaryButton>
            </Panel>
          </div>
          <Outlet />
        </PageScaffold>
      </div>
    </div>
  );
}
