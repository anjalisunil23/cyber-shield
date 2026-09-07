import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  delay = 0,
}: {
  label: string;
  value: number;
  delta: string;
  icon: LucideIcon;
  delay?: number;
}) {
  const { ref, value: n } = useCountUp(value, 1200);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="rounded-2xl border border-white/10 bg-[#111827]/90 p-5 shadow-[0_0_30px_-18px_rgba(59,130,246,0.55)] backdrop-blur"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-50">
            <span ref={ref}>{n.toLocaleString()}</span>
          </p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p
        className={cn(
          "mt-3 text-xs",
          delta.startsWith("-") ? "text-amber-400" : "text-emerald-400",
        )}
      >
        {delta}
      </p>
    </motion.div>
  );
}
