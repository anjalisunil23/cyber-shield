import { motion } from "framer-motion";
import { Brain, BrainCircuit, Fingerprint, Network, Shield, Timer } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { FolderLock, KeyRound, ScanSearch } from "lucide-react";
import { FeatureCard } from "./FeatureCard";

export function RegisterHero() {
  return (
    <div className="relative flex h-full flex-col justify-center px-6 py-10 lg:px-12 xl:px-16">
      <Link to="/" className="mb-8 inline-flex items-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-cyan shadow-[0_0_28px_-6px_rgba(59,130,246,0.8)]">
          <Shield className="h-5 w-5 text-white" />
        </span>
        <span className="text-lg font-bold tracking-tight text-slate-50">
          Cyber<span className="text-cyan">Shield</span>
        </span>
      </Link>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl text-4xl font-bold leading-tight tracking-tight text-slate-50 xl:text-5xl"
      >
        Secure Digital{" "}
        <span className="bg-gradient-to-r from-primary to-cyan bg-clip-text text-transparent">
          Investigation
        </span>{" "}
        Platform
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-4 max-w-lg text-base leading-relaxed text-slate-400"
      >
        Create investigator accounts with enterprise-grade security and role-based access.
      </motion.p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <FeatureCard icon={ScanSearch} title="AI Evidence Analysis" />
        <FeatureCard icon={FolderLock} title="Secure Evidence Storage" />
        <FeatureCard icon={KeyRound} title="Role-Based Access" />
        <FeatureCard icon={Shield} title="End-to-End Encryption" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="relative mt-10 hidden aspect-[16/10] w-full max-w-xl lg:block"
      >
        <svg viewBox="0 0 520 320" className="h-full w-full" aria-hidden>
          <defs>
            <linearGradient id="regGlow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <rect
            x="20"
            y="20"
            width="480"
            height="280"
            rx="24"
            fill="url(#regGlow)"
            opacity="0.15"
          />
          <line x1="90" y1="160" x2="200" y2="90" stroke="#3B82F6" strokeOpacity="0.45" />
          <line x1="200" y1="90" x2="330" y2="120" stroke="#06B6D4" strokeOpacity="0.45" />
          <line x1="200" y1="90" x2="250" y2="210" stroke="#3B82F6" strokeOpacity="0.35" />
          <line x1="330" y1="120" x2="420" y2="200" stroke="#06B6D4" strokeOpacity="0.4" />
          <line x1="90" y1="160" x2="250" y2="210" stroke="#3B82F6" strokeOpacity="0.3" />
          <circle cx="90" cy="160" r="10" fill="#3B82F6" />
          <circle cx="200" cy="90" r="14" fill="#06B6D4" />
          <circle cx="330" cy="120" r="10" fill="#3B82F6" />
          <circle cx="250" cy="210" r="9" fill="#22C55E" />
          <circle cx="420" cy="200" r="10" fill="#06B6D4" />
        </svg>

        <FloatBadge className="left-4 top-6" delay={0}>
          <Shield className="h-4 w-4 text-primary" /> Shield
        </FloatBadge>
        <FloatBadge className="right-8 top-10" delay={0.4}>
          <Brain className="h-4 w-4 text-cyan" /> AI Brain
        </FloatBadge>
        <FloatBadge className="bottom-10 left-10" delay={0.8}>
          <Fingerprint className="h-4 w-4 text-cyan" /> Biometric
        </FloatBadge>
        <FloatBadge className="bottom-8 right-6" delay={1.2}>
          <Network className="h-4 w-4 text-primary" /> Graph
        </FloatBadge>
        <FloatBadge className="left-1/2 top-1/2 -translate-x-1/2" delay={0.6}>
          <Timer className="h-4 w-4 text-emerald-400" /> Timeline
        </FloatBadge>
        <FloatBadge className="right-16 top-1/3" delay={1}>
          <BrainCircuit className="h-4 w-4 text-primary" /> Evidence
        </FloatBadge>
      </motion.div>
    </div>
  );
}

function FloatBadge({
  children,
  className,
  delay,
}: {
  children: ReactNode;
  className?: string;
  delay: number;
}) {
  return (
    <motion.div
      className={`absolute flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[rgba(15,23,42,0.85)] px-3 py-2 text-xs text-slate-200 shadow-lg backdrop-blur ${className}`}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4.5, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}
