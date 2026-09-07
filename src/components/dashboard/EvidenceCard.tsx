import { FileImage, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Badge, statusBadgeClass } from "@/components/dashboard/Badge";
import type { EvidenceItem } from "@/services/dashboardData";

export function EvidenceCard({ item }: { item: EvidenceItem }) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827]/90"
    >
      <div
        className="relative flex h-28 items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${item.color}33, #0F172A)` }}
      >
        <FileImage className="h-10 w-10 text-white/70" />
        <span className="absolute left-3 top-3 rounded-md bg-black/40 px-2 py-0.5 text-[10px] text-white/80">
          {item.type}
        </span>
      </div>
      <div className="p-4">
        <p className="truncate text-sm font-semibold text-slate-100">{item.name}</p>
        <p className="mt-1 text-xs text-slate-400">{item.date}</p>
        <div className="mt-3">
          <Badge
            className={statusBadgeClass(
              item.aiStatus === "Analyzed"
                ? "Completed"
                : item.aiStatus === "Processing"
                  ? "AI Processing"
                  : item.aiStatus === "Failed"
                    ? "Closed"
                    : "Open",
            )}
          >
            AI · {item.aiStatus}
          </Badge>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-xl bg-primary/20 py-2 text-xs font-semibold text-primary hover:bg-primary/30"
          >
            Open
          </button>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-slate-400 hover:text-red-400"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
