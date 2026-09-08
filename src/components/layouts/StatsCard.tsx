import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";

export function StatsCard({
  label,
  value,
  hint = "Live",
  icon: Icon,
  delay = 0,
  tone = "primary",
}: {
  label: string;
  value: number;
  hint?: string;
  icon: LucideIcon;
  delay?: number;
  tone?: "primary" | "cyan" | "emerald" | "amber" | "rose";
}) {
  const { ref, value: n } = useCountUp(value, 1100);
  const tones = {
    primary: "border-primary/20 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/10 dark:text-primary",
    cyan: "border-cyan/30 bg-cyan/10 text-cyan dark:border-cyan/30 dark:bg-cyan/10 dark:text-cyan",
    emerald: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-400",
    amber: "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-400",
    rose: "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="rounded-2xl border border-border bg-card p-5 shadow-xs backdrop-blur-sm transition-all dark:shadow-[0_0_30px_-18px_rgba(59,130,246,0.45)]"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            <span ref={ref}>{n.toLocaleString()}</span>
          </p>
        </div>
        <div className={cn("grid h-10 w-10 place-items-center rounded-xl border", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{hint}</p>
    </motion.div>
  );
}
