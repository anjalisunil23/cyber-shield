import { Lock, Fingerprint, ShieldCheck, Database, Scan, Radar } from "lucide-react";

const RINGS = [
  { size: 100, tilt: 74, dur: 18, opacity: 0.5 },
  { size: 84, tilt: 58, dur: 24, opacity: 0.4 },
  { size: 68, tilt: 38, dur: 30, opacity: 0.32 },
];

const CHIPS = [
  { Icon: ShieldCheck, label: "Chain of custody", top: "4%", left: "2%" },
  { Icon: Database, label: "Evidence vault", top: "24%", left: "76%" },
  { Icon: Scan, label: "AI correlation", top: "72%", left: "0%" },
  { Icon: Radar, label: "Live monitoring", top: "84%", left: "60%" },
];

export function CyberGlobe({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative mx-auto aspect-square w-full ${compact ? "max-w-[380px]" : "max-w-[540px]"}`}
      style={{ perspective: "1200px" }}
    >
      <div className="absolute left-1/2 top-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-glow/25 blur-3xl" />

      <div
        className="animate-float-slow absolute inset-0"
        style={{ transformStyle: "preserve-3d" }}
      >
        {RINGS.map((r, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full border border-violet-glow"
            style={{
              width: `${r.size}%`,
              height: `${r.size}%`,
              opacity: r.opacity,
              ["--tiltX" as string]: `${r.tilt}deg`,
              transform: `translate(-50%,-50%) rotateX(${r.tilt}deg)`,
              animation: `ring-spin ${r.dur}s linear infinite`,
              boxShadow: "0 0 24px -6px rgba(168,85,247,0.8)",
            }}
          />
        ))}

        <div className="absolute left-1/2 top-1/2 h-[46%] w-[46%] -translate-x-1/2 -translate-y-1/2">
          <div
            className="absolute inset-0 rounded-full border border-violet-glow/40"
            style={{
              background:
                "radial-gradient(circle at 32% 28%, rgba(168,85,247,0.42), rgba(10,1,24,0.9) 68%)",
              boxShadow:
                "inset 0 0 60px rgba(168,85,247,0.35), 0 0 70px -14px rgba(168,85,247,0.9)",
            }}
          />
          <div className="absolute inset-0 grid place-items-center">
            <Lock className="h-1/4 w-1/4 text-violet-glow drop-shadow-[0_0_18px_rgba(168,85,247,0.9)]" />
          </div>
        </div>

        <div
          className="absolute left-1/2 top-1/2 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-glow/25"
          style={{ animation: "radar-pulse 3.6s ease-out infinite" }}
        />
      </div>

      <div
        className="absolute left-1/2 top-[4%] flex -translate-x-1/2 items-center gap-2 rounded-full border border-violet-glow/45 bg-surface/70 px-4 py-2 text-[11px] font-medium backdrop-blur-md"
        style={{ boxShadow: "0 0 32px -10px rgba(168,85,247,0.95)" }}
      >
        <Fingerprint className="h-4 w-4 text-violet-glow" />
        Biometric session
      </div>

      {CHIPS.map(({ Icon, label }, i) => (
        <div
          key={label}
          className="animate-float-slow absolute flex items-center gap-2 rounded-xl border border-violet-glow/30 bg-surface/60 px-3 py-2 text-[11px] font-medium text-foreground/85 backdrop-blur-md"
          style={{
            top: CHIPS[i].top,
            left: CHIPS[i].left,
            animationDelay: `${i * 0.7}s`,
            boxShadow: "0 0 26px -10px rgba(168,85,247,0.9)",
          }}
        >
          <Icon className="h-4 w-4 shrink-0 text-violet-glow" />
          {label}
        </div>
      ))}
    </div>
  );
}
