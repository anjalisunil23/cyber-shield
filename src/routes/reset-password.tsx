import { createFileRoute, Link } from "@tanstack/react-router";
import { HudAuthCard, HudShell, hudInput } from "@/components/HudShell";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/reset-password")({ component: Page });

function Page() {
  return (
    <HudShell>
      <div className="mx-auto flex min-h-screen max-w-md items-center px-5 py-10">
        <div className="w-full">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-white/80">
            <Shield className="h-5 w-5" />
            <span className="text-sm font-semibold">Cyber Shield</span>
          </Link>
          <HudAuthCard>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <h1 className="text-lg font-semibold text-white">Reset password</h1>
              <input
                placeholder="Reset token"
                className={`${hudInput} w-full rounded-md bg-[#2a3340] px-3 py-3`}
              />
              <input
                type="password"
                placeholder="New password"
                className={`${hudInput} w-full rounded-md bg-[#2a3340] px-3 py-3`}
              />
              <input
                type="password"
                placeholder="Confirm password"
                className={`${hudInput} w-full rounded-md bg-[#2a3340] px-3 py-3`}
              />
              <button
                type="submit"
                className="w-full rounded-md bg-white py-3 text-sm font-bold text-[#0b1220]"
              >
                Update password
              </button>
              <Link to="/login" className="block text-center text-sm text-white/70 hover:underline">
                Back to login
              </Link>
            </form>
          </HudAuthCard>
        </div>
      </div>
    </HudShell>
  );
}
