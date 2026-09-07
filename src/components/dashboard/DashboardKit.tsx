import type { LucideIcon } from "lucide-react";

export function DashboardHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="animate-rise-in">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-glow">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">{subtitle}</p>
    </div>
  );
}

export function StatGrid({
  stats,
}: {
  stats: { label: string; value: string; hint: string; Icon: LucideIcon }[];
}) {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(({ label, value, hint, Icon }, i) => (
        <div
          key={label}
          className="glass-card glow-hover animate-rise-in p-5"
          style={{ animationDelay: `${0.05 * i}s` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
            </div>
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-violet-glow/35 bg-surface/60"
              style={{ boxShadow: "0 0 22px -8px rgba(168,85,247,0.9)" }}
            >
              <Icon className="h-5 w-5 text-violet-glow" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{hint}</p>
        </div>
      ))}
    </div>
  );
}

export function ActionGrid({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions: { title: string; desc: string; Icon: LucideIcon }[];
}) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold sm:text-3xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map(({ title: t, desc, Icon }, i) => (
          <article
            key={t}
            className="glass-card glow-hover animate-rise-in group p-5"
            style={{ animationDelay: `${0.04 * i}s` }}
          >
            <div
              className="grid h-11 w-11 place-items-center rounded-xl border border-violet-glow/35 bg-surface/60 transition-transform group-hover:scale-110"
              style={{ boxShadow: "0 0 22px -8px rgba(168,85,247,0.9)" }}
            >
              <Icon className="h-5 w-5 text-violet-glow" />
            </div>
            <h3 className="mt-4 text-base font-semibold">{t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ActivityPanel({
  title,
  items,
}: {
  title: string;
  items: { primary: string; secondary: string; tag: string }[];
}) {
  return (
    <section className="mt-12">
      <div className="animated-glow-border glass-card p-6 sm:p-7">
        <h2 className="text-xl font-semibold">{title}</h2>
        <ul className="mt-5 divide-y divide-border/60">
          {items.map((it) => (
            <li key={it.primary} className="flex flex-wrap items-center gap-3 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{it.primary}</p>
                <p className="truncate text-xs text-muted-foreground">{it.secondary}</p>
              </div>
              <span className="rounded-full border border-violet-glow/40 bg-accent/40 px-3 py-1 text-[11px] font-medium text-violet-glow">
                {it.tag}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
