import { Bot, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function AIAssistant() {
  return (
    <div className="rounded-2xl border border-cyan/20 bg-gradient-to-br from-[#111827] to-[#0F172A] p-5 shadow-[0_0_40px_-18px_rgba(6,182,212,0.55)]">
      <div className="mb-4 flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan/15 text-cyan">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-100">AI Investigation Panel</h3>
          <p className="text-[11px] text-slate-400">Case CS-2048 insights</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ["Detected Faces", "6 clusters"],
          ["Detected Objects", "14 items"],
          ["OCR Text", "128 lines"],
          ["Extracted Entities", "37"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-[11px] text-slate-400">{k}</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
        <p className="text-[11px] text-amber-300">Risk Score</p>
        <p className="text-2xl font-bold text-amber-400">92</p>
        <p className="mt-1 text-xs text-slate-400">
          Suggested connections: 3 devices · 2 locations · 5 contacts
        </p>
      </div>

      <button
        type="button"
        onClick={() => toast.success("AI summary generation started")}
        className="btn-brand mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold"
      >
        <Sparkles className="h-4 w-4" /> Generate Summary
      </button>
    </div>
  );
}
