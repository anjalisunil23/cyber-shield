import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function ChartCard({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-[#111827]/90 p-5 backdrop-blur"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        {action}
      </div>
      {children}
    </motion.div>
  );
}

export function QuickActionCard({
  label,
  description,
  icon: Icon,
  onClick,
}: {
  label: string;
  description: string;
  icon: LucideIcon;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -3, scale: 1.01 }}
      onClick={onClick}
      className="rounded-2xl border border-white/10 bg-[#111827]/90 p-4 text-left transition hover:border-cyan/40 hover:shadow-[0_0_28px_-14px_rgba(6,182,212,0.7)]"
    >
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl border border-cyan/30 bg-cyan/10 text-cyan">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-slate-100">{label}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </motion.button>
  );
}

export function AiPlaceholderCard({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-[#111827]/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-cyan/80">Phase 2 · AI</p>
      <p className="mt-2 text-sm font-medium text-slate-100">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{blurb}</p>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Panel({
  title,
  children,
  className = "",
  actions,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-[#111827]/90 p-5 ${className}`}>
      {title && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl border border-white/5 bg-white/5" />
      ))}
    </div>
  );
}
