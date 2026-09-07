import { Bell, Menu, Search } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { investigationApi } from "@/services/investigationApi";
import type { SearchResult } from "@/services/types";

export function TopNavbar({ onMenu }: { onMenu: () => void }) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const me = useQuery({ queryKey: ["me"], queryFn: () => investigationApi.me() });
  const unread = useQuery({ queryKey: ["unread"], queryFn: () => investigationApi.unreadCount() });

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const search = useQuery({
    queryKey: ["search", debounced],
    queryFn: () => investigationApi.search(debounced),
    enabled: debounced.length >= 2,
  });

  const initials = (me.data?.full_name || "CS")
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/10 bg-[#020617]/80 px-4 py-3 backdrop-blur-xl sm:px-6">
      <button
        type="button"
        onClick={onMenu}
        className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-slate-300 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Global search — cases, evidence, notes, investigators…"
          className="w-full rounded-xl border border-white/10 bg-[#111827] py-2.5 pl-10 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-primary/50"
        />
        {debounced.length >= 2 && (
          <SearchDropdown
            result={search.data}
            loading={search.isLoading}
            onClose={() => setQ("")}
          />
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <Link
          to="/dashboard/notifications"
          aria-label="Notifications"
          className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-slate-300 transition hover:border-primary/40 hover:text-white"
        >
          <Bell className="h-4 w-4" />
          {(unread.data?.count || 0) > 0 && (
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-cyan" />
          )}
        </Link>

        <div className="ml-1 flex items-center gap-2 rounded-xl border border-white/10 bg-[#111827] px-2 py-1.5 sm:px-3">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary to-cyan text-xs font-bold text-white">
            {initials}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-xs font-semibold text-slate-100">
              {me.data?.full_name || "Investigator"}
            </p>
            <p className="text-[10px] text-slate-400">{me.data?.role || "…"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function SearchDropdown({
  result,
  loading,
  onClose,
}: {
  result?: SearchResult;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-80 overflow-y-auto rounded-2xl border border-white/10 bg-[#0f172a] p-3 shadow-2xl">
      {loading && <p className="px-2 py-3 text-xs text-slate-500">Searching…</p>}
      {!loading && result && (
        <div className="space-y-3 text-sm">
          <Group title="Cases">
            {result.cases.map((c) => (
              <Link
                key={c.id}
                to="/dashboard/cases/$caseId"
                params={{ caseId: c.id }}
                onClick={onClose}
                className="block rounded-lg px-2 py-1.5 hover:bg-white/5"
              >
                {c.case_number} — {c.title}
              </Link>
            ))}
            {!result.cases.length && <Empty />}
          </Group>
          <Group title="Evidence">
            {result.evidence.map((e) => (
              <div key={e.id} className="rounded-lg px-2 py-1.5 text-slate-400">
                {e.original_name}
              </div>
            ))}
            {!result.evidence.length && <Empty />}
          </Group>
          <Group title="Investigators">
            {result.investigators.map((u) => (
              <div key={u.id} className="rounded-lg px-2 py-1.5 text-slate-400">
                {u.full_name} · {u.email}
              </div>
            ))}
            {!result.investigators.length && <Empty />}
          </Group>
        </div>
      )}
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 px-2 text-[10px] uppercase tracking-wide text-slate-500">{title}</p>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="px-2 text-xs text-slate-600">No matches</p>;
}
