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
      className="rounded-2xl border border-border bg-card p-5 shadow-xs backdrop-blur-sm"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
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
      className="rounded-2xl border border-border bg-card p-4 text-left shadow-xs transition hover:border-cyan/50 hover:shadow-md dark:hover:shadow-[0_0_28px_-14px_rgba(6,182,212,0.7)]"
    >
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl border border-cyan/30 bg-cyan/10 text-cyan">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </motion.button>
  );
}

export function AiPlaceholderCard({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-cyan">Phase 2 · AI</p>
      <p className="mt-2 text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{blurb}</p>
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
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
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
    <div className={`rounded-2xl border border-border bg-card p-5 shadow-xs ${className}`}>
      {title && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
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
        <div key={i} className="h-28 animate-pulse rounded-2xl border border-border/50 bg-muted/60" />
      ))}
    </div>
  );
}
