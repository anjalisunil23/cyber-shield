import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Fingerprint,
  Loader2,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { InputField } from "./InputField";
import { PasswordInput, getPasswordChecks, passwordStrong } from "./PasswordInput";
import { REGISTER_ROLES, RoleSelect } from "./RoleSelect";

const DEPARTMENTS = [
  "Cyber Crime",
  "Digital Forensics",
  "Intelligence",
  "Special Investigation",
  "Child Protection Unit",
];

type Props = {
  onSubmit: (payload: {
    full_name: string;
    email: string;
    password: string;
    confirm_password: string;
    role: string;
    department: string | null;
  }) => Promise<void>;
  submitting: boolean;
  error: string | null;
  success: string | null;
};

export function RegisterCard({ onSubmit, submitting, error, success }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [role, setRole] = useState<string>(REGISTER_ROLES[0]);
  const [badge, setBadge] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      const msg = "Full name is required.";
      setLocalError(msg);
      toast.error(msg);
      return;
    }

    if (cleanName.length < 2) {
      const msg = "Full name must be at least 2 characters long.";
      setLocalError(msg);
      toast.error(msg);
      return;
    }

    if (!cleanEmail) {
      const msg = "Email address is required.";
      setLocalError(msg);
      toast.error(msg);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      const msg = "Please enter a valid email address (e.g. officer@agency.gov).";
      setLocalError(msg);
      toast.error(msg);
      return;
    }

    if (cleanPhone && !/^[+0-9\s\-()]{7,20}$/.test(cleanPhone)) {
      const msg = "Please enter a valid phone number (e.g. +1 555 0100).";
      setLocalError(msg);
      toast.error(msg);
      return;
    }

    if (!password) {
      const msg = "Password is required.";
      setLocalError(msg);
      toast.error(msg);
      return;
    }

    const checks = getPasswordChecks(password);
    if (!checks.length) {
      const msg = "Password must be at least 8 characters long.";
      setLocalError(msg);
      toast.error(msg);
      return;
    }

    if (!checks.upper) {
      const msg = "Password must contain at least one uppercase letter (A-Z).";
      setLocalError(msg);
      toast.error(msg);
      return;
    }

    if (!checks.number) {
      const msg = "Password must contain at least one number (0-9).";
      setLocalError(msg);
      toast.error(msg);
      return;
    }

    if (!checks.special) {
      const msg = "Password must contain at least one special character (!@#$%^&*).";
      setLocalError(msg);
      toast.error(msg);
      return;
    }

    if (!confirm) {
      const msg = "Please confirm your password.";
      setLocalError(msg);
      toast.error(msg);
      return;
    }

    if (password !== confirm) {
      const msg = "Passwords do not match.";
      setLocalError(msg);
      toast.error(msg);
      return;
    }

    if (!terms) {
      const msg = "Please agree to the Privacy Policy and Terms of Service.";
      setLocalError(msg);
      toast.error(msg);
      return;
    }

    const deptParts = [department];
    if (cleanPhone) deptParts.push(`Phone: ${cleanPhone}`);
    if (badge.trim()) deptParts.push(`Badge: ${badge.trim()}`);

    await onSubmit({
      full_name: cleanName,
      email: cleanEmail,
      password,
      confirm_password: confirm,
      role,
      department: deptParts.join(" · "),
    });
  }

  const displayError = localError || error;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-[560px] rounded-3xl border border-white/[0.08] bg-[rgba(15,23,42,0.75)] p-6 shadow-[0_0_80px_-20px_rgba(59,130,246,0.55)] backdrop-blur-xl sm:p-8"
    >
      <div className="absolute left-1/2 top-0 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan/40 bg-[#020617] shadow-[0_0_40px_-4px_rgba(6,182,212,0.7)]">
        <Fingerprint className="h-7 w-7 text-cyan" />
      </div>

      <div className="mt-4 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-50">Create Your Account</h2>
        <p className="mt-2 text-sm text-slate-400">
          Join CyberShield to securely investigate and manage digital evidence.
        </p>
      </div>

      <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
        {displayError && (
          <div
            role="alert"
            className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {displayError}
          </div>
        )}
        {success && (
          <div
            role="status"
            className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
          >
            {success}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Full Name"
            icon={User}
            name="full_name"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Alex Mercer"
          />
          <InputField
            label="Email"
            icon={Mail}
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="officer@agency.gov"
          />
          <InputField
            label="Phone Number"
            icon={Phone}
            name="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 0100"
          />
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-300">Department</span>
            <span className="relative block">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-white/[0.08] bg-[#0B1220] py-3 pl-10 pr-3 text-sm text-slate-50 outline-none transition focus:border-primary/60 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d} className="bg-[#0F172A]">
                    {d}
                  </option>
                ))}
              </select>
            </span>
          </label>
          <RoleSelect value={role} onChange={setRole} />
          <InputField
            label="Badge Number (optional)"
            icon={BadgeCheck}
            name="badge"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            placeholder="BADGE-00421"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordInput
            label="Password"
            name="password"
            value={password}
            onChange={setPassword}
            showStrength
          />
          <PasswordInput
            label="Confirm Password"
            name="confirm_password"
            value={confirm}
            onChange={setConfirm}
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 transition hover:border-primary/30">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-[#0B1220] accent-primary"
          />
          <span className="text-sm text-slate-300">
            I agree to the{" "}
            <a href="#" className="text-cyan hover:underline">
              Privacy Policy
            </a>{" "}
            and{" "}
            <a href="#" className="text-cyan hover:underline">
              Terms
            </a>
            .
          </span>
        </label>

        <motion.button
          type="submit"
          disabled={submitting}
          whileHover={{ scale: submitting ? 1 : 1.01 }}
          whileTap={{ scale: submitting ? 1 : 0.99 }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-cyan py-3.5 text-sm font-semibold text-white shadow-[0_0_40px_-8px_rgba(59,130,246,0.75)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
            </>
          ) : (
            <>
              Create Secure Account <ArrowRight className="h-4 w-4" />
            </>
          )}
        </motion.button>

        <Link
          to="/login"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.12] py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan/40 hover:bg-white/5 hover:shadow-[0_0_24px_-10px_rgba(6,182,212,0.6)]"
        >
          <Briefcase className="h-4 w-4 text-cyan" /> Login
        </Link>

        <p className="text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-cyan hover:underline">
            Login →
          </Link>
        </p>
      </form>
    </motion.div>
  );
}
