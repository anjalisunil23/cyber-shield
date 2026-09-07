import { Download, FileDown, History, Share2 } from "lucide-react";
import { toast } from "sonner";

const ACTIONS = [
  { label: "Generate PDF", icon: FileDown },
  { label: "Export Evidence", icon: Download },
  { label: "Share Report", icon: Share2 },
  { label: "Download Timeline", icon: History },
];

export function ReportGenerator() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827]/90 p-5">
      <h3 className="text-sm font-semibold text-slate-100">Report Generator</h3>
      <p className="mt-1 text-xs text-slate-400">
        Produce investigation outputs with provenance links.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {ACTIONS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => toast.message(`${label} started`)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left text-xs font-medium text-slate-200 transition hover:border-primary/40 hover:bg-primary/10"
          >
            <Icon className="h-4 w-4 text-cyan" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
