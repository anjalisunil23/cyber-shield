import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const REGISTER_ROLES = [
  "Investigator",
  "Superior Officer",
  "Administrator",
  "Major Admin",
] as const;

export function RoleSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => REGISTER_ROLES.filter((r) => r.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={rootRef} className="relative space-y-1.5">
      <span className="text-xs font-medium text-slate-300" id="role-label">
        Role
      </span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby="role-label"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-2xl border border-white/[0.08] bg-[#0B1220] px-3 py-3 text-left text-sm text-slate-50 outline-none transition focus:border-primary/60 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
      >
        <span>{value}</span>
        <ChevronDown className={cn("h-4 w-4 text-slate-500 transition", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0F172A] shadow-2xl shadow-black/40">
          <div className="relative border-b border-white/[0.06] p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search roles…"
              className="w-full rounded-xl bg-white/5 py-2 pl-8 pr-3 text-xs text-slate-100 outline-none placeholder:text-slate-500"
              autoFocus
            />
          </div>
          <ul role="listbox" className="max-h-48 overflow-y-auto p-1">
            {filtered.map((role) => (
              <li key={role}>
                <button
                  type="button"
                  role="option"
                  aria-selected={role === value}
                  onClick={() => {
                    onChange(role);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-white/5",
                    role === value ? "text-cyan" : "text-slate-200",
                  )}
                >
                  {role}
                  {role === value && <Check className="h-4 w-4" />}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-3 text-xs text-slate-500">No roles found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
