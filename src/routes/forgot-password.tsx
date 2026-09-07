import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Shield } from "lucide-react";
import { ApiError, forgotPassword, resetPassword } from "@/lib/api";
import { HudAuthCard, HudShell, hudInput } from "@/components/HudShell";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onRequest(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await forgotPassword(email);
      setMessage(res.message);
      if (res.reset_token) {
        setToken(res.reset_token);
        setStep("reset");
        setMessage("Dev mode: reset token issued. Set a new password below.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  async function onReset(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await resetPassword(token, password);
      setMessage("Password reset. You can sign in.");
      void navigate({ to: "/login" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <HudShell>
      <div className="mx-auto flex min-h-screen max-w-md items-center px-5 py-10">
        <div className="w-full animate-rise-in">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-white/80">
            <Shield className="h-5 w-5" />
            <span className="font-display text-sm font-semibold">Cyber Shield</span>
          </Link>
          <HudAuthCard>
            {step === "request" ? (
              <form className="space-y-4" onSubmit={onRequest}>
                <h1 className="text-lg font-semibold text-white">Forgot password</h1>
                {message && <p className="text-sm text-emerald-300">{message}</p>}
                {error && <p className="text-sm text-red-300">{error}</p>}
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className={`${hudInput} w-full rounded-md bg-[#2a3340] px-3 py-3`}
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-md bg-white py-3 text-sm font-bold text-[#0b1220] disabled:opacity-60"
                >
                  {busy ? "Sending…" : "Send reset"}
                </button>
                <Link
                  to="/login"
                  className="block text-center text-sm text-white/70 hover:underline"
                >
                  Back to login
                </Link>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={onReset}>
                <h1 className="text-lg font-semibold text-white">Reset password</h1>
                {message && <p className="text-sm text-emerald-300">{message}</p>}
                {error && <p className="text-sm text-red-300">{error}</p>}
                <input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Reset token"
                  className={`${hudInput} w-full rounded-md bg-[#2a3340] px-3 py-3`}
                />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  className={`${hudInput} w-full rounded-md bg-[#2a3340] px-3 py-3`}
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-md bg-white py-3 text-sm font-bold text-[#0b1220] disabled:opacity-60"
                >
                  {busy ? "Saving…" : "Update password"}
                </button>
              </form>
            )}
          </HudAuthCard>
        </div>
      </div>
    </HudShell>
  );
}
