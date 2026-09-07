import { motion } from "framer-motion";
import {
  BarChart3,
  Bot,
  Cloud,
  FileSearch,
  Image as ImageIcon,
  Network,
  Upload,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMouseParallax } from "@/hooks/useMouseParallax";

export function HeroIllustration() {
  const { x, y } = useMouseParallax(18);

  return (
    <motion.div style={{ x, y }} className="relative mx-auto aspect-square w-full max-w-[540px]">
      <div className="absolute inset-8 rounded-[2rem] bg-gradient-to-br from-primary/20 via-transparent to-cyan/20 blur-2xl" />

      <div className="relative h-full rounded-[1.5rem] border border-white/10 bg-[rgb(17_24_39/0.8)] p-4 shadow-[0_0_60px_-20px_rgba(59,130,246,0.55)] backdrop-blur-xl sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-muted-foreground">
            Case · CS-2048
          </div>
        </div>

        <div className="grid h-[calc(100%-2rem)] gap-3 sm:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3">
            <Panel title="Evidence Upload" icon={Upload}>
              <div className="mt-2 space-y-2">
                {["IMG_4821.jpg", "chat_export.zip", "call_logs.csv"].map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5 text-[10px] text-muted-foreground"
                  >
                    <FileSearch className="h-3 w-3 text-cyan" />
                    {f}
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="AI Assistant" icon={Bot}>
              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                Detected 3 linked entities across chat and media. Suggested lead score:{" "}
                <span className="text-success">92</span>
              </p>
            </Panel>
            <Panel title="Secure Cloud" icon={Cloud}>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-cyan"
                  initial={{ width: "0%" }}
                  animate={{ width: "78%" }}
                  transition={{ duration: 1.6, delay: 0.4 }}
                />
              </div>
            </Panel>
          </div>

          <div className="space-y-3">
            <Panel title="Analytics" icon={BarChart3}>
              <div className="mt-3 flex h-16 items-end gap-1.5">
                {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-primary/40 to-cyan"
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 0.2 + i * 0.08, duration: 0.6 }}
                  />
                ))}
              </div>
            </Panel>
            <Panel title="Relationship Graph" icon={Network}>
              <div className="relative mt-2 h-24">
                <svg viewBox="0 0 200 96" className="h-full w-full">
                  <line x1="40" y1="48" x2="100" y2="24" stroke="rgba(59,130,246,0.5)" />
                  <line x1="100" y1="24" x2="160" y2="48" stroke="rgba(6,182,212,0.5)" />
                  <line x1="100" y1="24" x2="100" y2="72" stroke="rgba(59,130,246,0.45)" />
                  <line x1="40" y1="48" x2="100" y2="72" stroke="rgba(6,182,212,0.35)" />
                  <circle cx="40" cy="48" r="8" fill="#3b82f6" />
                  <circle cx="100" cy="24" r="10" fill="#06b6d4" />
                  <circle cx="160" cy="48" r="8" fill="#3b82f6" />
                  <circle cx="100" cy="72" r="7" fill="#22c55e" />
                </svg>
              </div>
            </Panel>
            <div className="grid grid-cols-2 gap-3">
              <Panel title="Timeline" icon={BarChart3} compact>
                <div className="mt-2 space-y-1.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-1.5 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{ width: `${40 + i * 18}%` }}
                      />
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel title="Media" icon={ImageIcon} compact>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-md bg-gradient-to-br from-primary/30 to-cyan/20"
                    />
                  ))}
                </div>
              </Panel>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        className="absolute -right-2 top-10 rounded-xl border border-cyan/30 bg-[#111827]/90 px-3 py-2 text-xs text-cyan shadow-lg backdrop-blur"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        AI scan complete
      </motion.div>
      <motion.div
        className="absolute -left-2 bottom-16 rounded-xl border border-primary/30 bg-[#111827]/90 px-3 py-2 text-xs text-primary shadow-lg backdrop-blur"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        12 entities linked
      </motion.div>
    </motion.div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
  compact,
}: {
  title: string;
  icon: typeof Upload;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-white/[0.03] ${compact ? "p-2.5" : "p-3"}`}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-medium text-foreground/90">
        <Icon className="h-3 w-3 text-cyan" />
        {title}
      </div>
      {children}
    </div>
  );
}
