import type { ReactNode } from "react";
import {
  Building2,
  Cloud,
  FilePenLine,
  Fingerprint,
  Lock,
  ShoppingCart,
  TrendingUp,
  Wallet,
  Shield,
} from "lucide-react";

const SIDE_ICONS = [
  { Icon: Building2, top: "18%", left: "6%" },
  { Icon: TrendingUp, top: "28%", left: "14%" },
  { Icon: Wallet, top: "40%", left: "4%" },
  { Icon: ShoppingCart, top: "52%", left: "12%" },
  { Icon: Cloud, top: "22%", left: "28%" },
  { Icon: FilePenLine, top: "48%", left: "30%" },
];

const GAUGES = [28, 52, 74, 92];

/** Shared cyber-HUD visual stage (globe, shield, gauges). */
export function HudVisualStage({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`relative ${compact ? "min-h-[360px]" : "min-h-[520px]"} w-full`}>
      <div className="absolute left-[8%] top-[12%] h-56 w-40 rounded-md border border-white/10 bg-[#0d1b3a]/45 shadow-[0_0_40px_rgba(40,90,200,0.25)] backdrop-blur-sm" />
      <div className="absolute bottom-[18%] left-[18%] h-44 w-52 rounded-md border border-white/10 bg-[#0d1b3a]/35 backdrop-blur-sm" />

      {SIDE_ICONS.map(({ Icon, top, left }, i) => (
        <div
          key={i}
          className="absolute grid h-9 w-9 place-items-center text-white/85"
          style={{
            top,
            left,
            animation: `float-slow ${6 + i * 0.4}s ease-in-out ${i * 0.2}s infinite`,
          }}
        >
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </div>
      ))}

      <div className="absolute left-[18%] top-[26%] grid h-36 w-36 place-items-center">
        <div className="absolute inset-0 rounded-full bg-[#2b6cff]/15 blur-2xl" />
        <Shield className="h-28 w-28 text-white" strokeWidth={1.15} />
        <Lock className="absolute h-8 w-8 text-white" strokeWidth={1.75} />
      </div>

      <div className="absolute left-1/2 top-1/2 w-[min(420px,100%)] -translate-x-[42%] -translate-y-[48%]">
        <div className="relative mx-auto aspect-square w-full max-w-[360px]">
          <svg viewBox="0 0 360 360" className="h-full w-full" aria-hidden>
            <defs>
              <radialGradient id="hudGlobeGlow" cx="50%" cy="45%" r="55%">
                <stop offset="0%" stopColor="#7eb6ff" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0a1630" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="180" cy="180" r="150" fill="url(#hudGlobeGlow)" />
            {[40, 70, 100, 130, 150].map((r) => (
              <ellipse
                key={`lat-${r}`}
                cx="180"
                cy="180"
                rx={r}
                ry={r * 0.42}
                fill="none"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="1"
              />
            ))}
            {[0, 30, 60, 90, 120, 150].map((deg) => (
              <ellipse
                key={`lon-${deg}`}
                cx="180"
                cy="180"
                rx={40 + (deg % 50)}
                ry={148}
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="1"
                transform={`rotate(${deg} 180 180)`}
              />
            ))}
            <circle
              cx="180"
              cy="180"
              r="148"
              fill="none"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1.25"
            />
            {Array.from({ length: 48 }, (_, i) => {
              const a = (i / 48) * Math.PI * 2;
              const r = 55 + (i % 5) * 18;
              return (
                <circle
                  key={i}
                  cx={180 + Math.cos(a) * r}
                  cy={180 + Math.sin(a) * r * 0.72}
                  r={1.4}
                  fill="white"
                  opacity={0.55 + (i % 3) * 0.12}
                />
              );
            })}
          </svg>
          <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2">
            <div className="grid h-24 w-24 place-items-center rounded-2xl bg-white/5 shadow-[0_0_50px_rgba(120,180,255,0.45)] backdrop-blur-sm">
              <Lock
                className="h-14 w-14 text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.65)]"
                strokeWidth={1.5}
              />
            </div>
          </div>
        </div>

        <div className="mt-2 text-center">
          <p className="font-display text-2xl font-semibold tracking-[0.18em] text-white">
            CYBER SHIELD
          </p>
          <div className="mt-3 flex items-center justify-center gap-2 text-[11px] tracking-[0.22em] text-white/70">
            <Cloud className="h-3.5 w-3.5" />
            <span>DATA PROTECTION</span>
            <span className="ml-1 flex gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-white/70"
                  style={{ opacity: 0.35 + i * 0.08 }}
                />
              ))}
            </span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-[10%] left-[8%] flex gap-4">
        {GAUGES.map((value, i) => (
          <div key={i} className="relative h-12 w-12">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(value / 100) * 88} 88`}
                opacity="0.85"
              />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Page shell with cyber HUD atmosphere. */
export function HudShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`login-hud relative min-h-screen overflow-hidden text-white ${className}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#1e4fd8]/25 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#1639a8]/30 blur-3xl" />
        <div className="absolute left-1/3 top-1/4 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/** Fingerprint-framed auth card used on login/register. */
export function HudAuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="relative rounded-sm border border-white/70 bg-[#07111f]/55 px-6 pb-8 pt-12 shadow-[0_0_60px_rgba(30,80,180,0.28)] backdrop-blur-md sm:px-8">
      <div className="absolute left-1/2 top-0 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-[#0a1528]">
        <Fingerprint className="h-8 w-8 text-white" strokeWidth={1.4} />
      </div>
      {children}
      <div aria-hidden className="pointer-events-none absolute -bottom-3 -right-3 opacity-70">
        <svg width="54" height="54" viewBox="0 0 54 54" fill="none">
          <circle cx="22" cy="22" r="10" stroke="white" strokeWidth="1.4" />
          <circle cx="22" cy="22" r="3" fill="white" />
          <circle cx="36" cy="34" r="8" stroke="white" strokeWidth="1.2" />
          <circle cx="36" cy="34" r="2.5" fill="white" />
        </svg>
      </div>
    </div>
  );
}

export const hudField =
  "flex w-full items-center gap-3 rounded-md bg-[#2a3340] px-3 py-3 text-sm text-white outline-none placeholder:text-white/45";

export const hudInput =
  "w-full bg-transparent text-sm text-white outline-none placeholder:text-white/45";
