import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, type FormEvent } from "react";
import { Eye, EyeOff, Lock, Shield, User, X } from "lucide-react";
import { ApiError, loginUser } from "@/lib/api";
import { clearToken, isAuthenticated, setTokens } from "@/lib/auth";
import { homeForRole } from "@/lib/roles";
import { investigationApi } from "@/services/investigationApi";
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

const REMEMBERED_EMAIL_KEY = "cybershield_remembered_email";
const REMEMBER_ME_KEY = "cybershield_remember_me";

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Initialize email & rememberMe from localStorage
  const [email, setEmail] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(REMEMBERED_EMAIL_KEY) || "";
    }
    return "";
  });
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window !== "undefined") {
      const storedVal = localStorage.getItem(REMEMBER_ME_KEY);
      if (storedVal !== null) return storedVal === "true";
      return !!localStorage.getItem(REMEMBERED_EMAIL_KEY);
    }
    return false;
  });

  // If already authenticated with a valid token, seamlessly redirect to dashboard
  useEffect(() => {
    if (typeof window !== "undefined" && isAuthenticated()) {
      investigationApi
        .me()
        .then((me) => {
          if (me && me.role) {
            window.location.assign(homeForRole(me.role));
          }
        })
        .catch(() => {
          // Token is expired or invalid; clean up so user can log in
          clearToken();
        });
    }
  }, []);

  // Autofocus password if email was already remembered on initial load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const remembered = localStorage.getItem(REMEMBERED_EMAIL_KEY);
      if (remembered && passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
    }
  }, []);

  function handleClearRemembered() {
    setEmail("");
    setPassword("");
    setRememberMe(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      localStorage.removeItem(REMEMBER_ME_KEY);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    if (!cleanEmail || !cleanPassword) {
      setError("Email and password are required.");
      return;
    }

    setSubmitting(true);
    try {
      const token = await loginUser({ email: cleanEmail, password: cleanPassword });

      // Handle Remember Me persistence
      if (typeof window !== "undefined") {
        if (rememberMe) {
          localStorage.setItem(REMEMBERED_EMAIL_KEY, cleanEmail);
          localStorage.setItem(REMEMBER_ME_KEY, "true");
        } else {
          localStorage.removeItem(REMEMBERED_EMAIL_KEY);
          localStorage.removeItem(REMEMBER_ME_KEY);
        }
      }

      setTokens(token.access_token, token.refresh_token);
      window.location.assign(homeForRole(token.role));
    } catch (err) {
      let message = "Could not sign in.";
      if (err instanceof ApiError) {
        if (err.status === 502 || err.message.toLowerCase().includes("bad gateway")) {
          message =
            "Cannot reach the backend server (502 Bad Gateway). Please ensure the Python API is running on port 8001.";
        } else {
          message = err.message;
        }
      } else if (err instanceof TypeError) {
        message = "Cannot reach the API. Make sure the backend server is running on port 8001.";
      } else if (err instanceof Error) {
        message = err.message;
      }
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
                <div className="mb-1.5 flex items-center justify-between text-xs tracking-wide text-white/60">
                  <span>Email</span>
                  {email && rememberMe && (
                    <button
                      type="button"
                      onClick={handleClearRemembered}
                      className="text-[11px] text-white/40 hover:text-white/80 transition-colors inline-flex items-center gap-1"
                    >
                      <X className="h-3 w-3" /> Clear remembered
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 rounded-md bg-[#2a3340] px-3 py-3">
                  <User className="h-4 w-4 shrink-0 text-white/55" />
                  <input
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    ref={passwordInputRef}
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 accent-white cursor-pointer"
                  />
                  <span>Remember me</span>
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
