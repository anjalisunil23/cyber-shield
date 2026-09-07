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
      <div className="flex items-center justify-center min-h-screen bg-[#020617] text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] px-4 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <PageScaffold
          crumbs={[{ label: "Home", to: "/" }, { label: "Profile" }]}
          title="User Profile"
          subtitle="View and edit your account settings"
          actions={
            <Link to="/profile/edit" className="text-sm text-purple-400 hover:text-purple-300">
              Edit profile
            </Link>
          }
        >
          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-xl font-bold text-purple-300">
              {user?.full_name?.charAt(0) || "U"}
            </div>
            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-lg font-bold">{user?.full_name || "Agent"}</h2>
              <p className="text-sm text-slate-400">{user?.email}</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-1">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {user?.role}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-white/5">
                  {user?.department || "General Unit"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Panel title="Security & Notifications">
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/profile/edit" className="text-purple-400 hover:underline">
                    Edit Account Details
                  </Link>
                </li>
                <li>
                  <Link to="/profile/security" className="text-purple-400 hover:underline">
                    Change Password
                  </Link>
                </li>
                <li>
                  <Link to="/notifications" className="text-purple-400 hover:underline">
                    System Alerts Center
                  </Link>
                </li>
              </ul>
            </Panel>
            <Panel title="Session Management">
              <p className="text-sm text-slate-400">
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
