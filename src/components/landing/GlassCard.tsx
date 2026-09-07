import { motion, type MotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
} & MotionProps;

export function GlassCard({ children, className, hover = true, ...motionProps }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover ? { y: -6 } : undefined}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-[rgb(17_24_39/0.75)] p-6 backdrop-blur-xl",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:opacity-0 before:transition-opacity before:duration-300",
        "before:bg-[linear-gradient(135deg,rgba(59,130,246,0.18),transparent_40%,rgba(6,182,212,0.14))]",
        hover &&
          "hover:border-primary/40 hover:before:opacity-100 hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.55)]",
        className,
      )}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
