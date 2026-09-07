import { motion } from "framer-motion";
import { ChevronRight, FileQuestion, Inbox, Search } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PageHeader, Panel } from "@/components/layouts/DashboardWidgets";

export function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-slate-500">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          {item.to ? (
            <Link to={item.to as "/"} className="hover:text-cyan">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-300">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function EmptyState({
  title = "Nothing here yet",
  description = "Items will appear once available.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#111827]/40 px-6 py-16 text-center">
      <Inbox className="mb-3 h-10 w-10 text-slate-600" />
      <p className="text-sm font-semibold text-slate-200">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message = "Something went wrong loading this view.",
}: {
  message?: string;
}) {
  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-6 text-center text-sm text-rose-200">
      <FileQuestion className="mx-auto mb-2 h-6 w-6" />
      {message}
    </div>
  );
}

export function LoadingBlock({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-white/5" />
      ))}
    </div>
  );
}

export function Toolbar({
  search,
  onSearch,
  placeholder = "Search…",
  filters,
  actions,
}: {
  search: string;
  onSearch: (v: string) => void;
  placeholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-white/10 bg-[#111827] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary/50"
        />
      </div>
      {filters}
      {actions}
    </div>
  );
}

export function SelectFilter({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  label?: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-white/10 bg-[#111827] px-3 py-2.5 text-xs"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      type={type}
      onClick={onClick}
      className={cn(
        "rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90",
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

export function GhostButton({
  children,
  onClick,
  type = "button",
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        "rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f172a] p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-50">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="text-sm text-slate-400">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <GhostButton onClick={onClose}>Cancel</GhostButton>
        <PrimaryButton onClick={onConfirm}>Confirm</PrimaryButton>
      </div>
    </Modal>
  );
}

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  emptyTitle,
}: {
  columns: Column<T>[];
  rows: T[];
  emptyTitle?: string;
}) {
  if (!rows.length) return <EmptyState title={emptyTitle || "No records"} />;
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#111827]/90">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-slate-400">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={cn("px-4 py-3 font-medium", c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <motion.tr
              key={row.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="border-b border-white/5 transition hover:bg-white/[0.03]"
            >
              {columns.map((c) => (
                <td key={c.key} className={cn("px-4 py-3 text-slate-300", c.className)}>
                  {c.render(row)}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (p: number) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
      <span>
        Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        <GhostButton className="px-3 py-1.5 text-xs" onClick={() => onPage(Math.max(1, page - 1))}>
          Previous
        </GhostButton>
        <GhostButton
          className="px-3 py-1.5 text-xs"
          onClick={() => onPage(Math.min(pages, page + 1))}
        >
          Next
        </GhostButton>
      </div>
    </div>
  );
}

export function useClientTable<T>(items: T[], pageSize = 8) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
  }, [items, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  return { search, setSearch, page: safePage, setPage, pages, rows, total: filtered.length };
}

export function StatusPill({ value }: { value: string }) {
  const v = value.toLowerCase();
  const tone =
    v.includes("active") || v.includes("done") || v.includes("completed")
      ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
      : v.includes("critical") || v.includes("suspend") || v.includes("high")
        ? "border-rose-500/30 bg-rose-500/15 text-rose-400"
        : v.includes("progress") || v.includes("review") || v.includes("pending")
          ? "border-amber-500/30 bg-amber-500/15 text-amber-300"
          : "border-white/10 bg-white/5 text-slate-300";
  return (
    <span
      className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium", tone)}
    >
      {value}
    </span>
  );
}

export function PageScaffold({
  crumbs,
  title,
  subtitle,
  actions,
  children,
}: {
  crumbs: { label: string; to?: string }[];
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <Breadcrumb items={crumbs} />
      <PageHeader title={title} subtitle={subtitle} actions={actions} />
      {children}
    </motion.div>
  );
}

export { PageHeader, Panel };
export { ChartCard } from "@/components/layouts/DashboardWidgets";
