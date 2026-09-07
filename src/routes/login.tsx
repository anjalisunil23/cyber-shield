import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Lock, Shield, User } from "lucide-react";
import { ApiError, loginUser } from "@/lib/api";
import { setTokens } from "@/lib/auth";
import { homeForRole } from "@/lib/roles";
import { HudAuthCard, HudShell, HudVisualStage, hudInput } from "@/components/HudShell";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Cyber Shield" },
      {
        name: "description",
        content: "Sign in to the Cyber Shield investigation support platform.",
      },
      { property: "og:title", content: "Login — Cyber Shield" },
      {
        property: "og:description",
        content:
          "Secure role-based access for Major Admin, Admin, Superior Officer, and Investigator.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(data.get("password") ?? "");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setSubmitting(true);
    try {
      const token = await loginUser({ email, password });
      setTokens(token.access_token, token.refresh_token);
      window.location.assign(homeForRole(token.role));
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof TypeError
            ? "Cannot reach the API. Make sure the backend is running on port 8001."
            : err instanceof Error
              ? err.message
              : "Could not sign in.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <HudShell>
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:px-10">
        <div className="relative hidden lg:block">
          <HudVisualStage />
        </div>

        <div className="animate-rise-in mx-auto w-full max-w-[420px]">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-white/80 transition-colors hover:text-white lg:hidden"
          >
            <Shield className="h-5 w-5" />
            <span className="font-display text-sm font-semibold tracking-wide">Cyber Shield</span>
          </Link>

          <HudAuthCard>
            <form className="space-y-5" onSubmit={onSubmit}>
              {error && (
                <div
                  role="alert"
                  className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
                >
                  {error}
                </div>
              )}

              <label className="block">
                <span className="mb-1.5 block text-xs tracking-wide text-white/60">Email</span>
                <div className="flex items-center gap-3 rounded-md bg-[#2a3340] px-3 py-3">
                  <User className="h-4 w-4 shrink-0 text-white/55" />
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="username"
                    placeholder="officer@agency.gov"
                    className={hudInput}
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs tracking-wide text-white/60">Password</span>
                <div className="flex items-center gap-3 rounded-md bg-[#2a3340] px-3 py-3">
                  <Lock className="h-4 w-4 shrink-0 text-white/55" />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••"
                    className={hudInput}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="text-white/45 transition-colors hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              <div className="flex items-center justify-between text-xs text-white/80">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-3.5 w-3.5 accent-white" />
                  Remember me
                </label>
                <Link to="/forgot-password" className="hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-white py-3 text-sm font-bold tracking-[0.2em] text-[#0b1220] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "SIGNING IN…" : "LOGIN"}
              </button>

              <Link
                to="/register"
                className="block w-full rounded-md border border-white/80 py-3 text-center text-sm font-semibold tracking-[0.2em] text-white transition hover:bg-white/10"
              >
                REGISTER
              </Link>
            </form>
          </HudAuthCard>
        </div>
      </div>
    </HudShell>
  );
}
