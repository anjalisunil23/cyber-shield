import {
  Network,
  FileSearch,
  Fingerprint,
  FileText,
  Users,
  Image as ImageIcon,
  Box,
} from "lucide-react";

const ORBIT = [
  { Icon: Network, top: "8%", left: "6%", delay: "0s" },
  { Icon: FileSearch, top: "4%", left: "74%", delay: "0.4s" },
  { Icon: Fingerprint, top: "36%", left: "-2%", delay: "0.8s" },
  { Icon: FileText, top: "32%", left: "88%", delay: "1.2s" },
  { Icon: Users, top: "66%", left: "4%", delay: "1.6s" },
  { Icon: ImageIcon, top: "64%", left: "86%", delay: "2s" },
  { Icon: Box, top: "88%", left: "46%", delay: "2.4s" },
];

export function ShieldGraphic(_props: { priority?: boolean }) {
  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[520px]"
      style={{ perspective: "900px" }}
      aria-hidden
    >
      {/* Ambient glow */}
      <div className="absolute left-1/2 top-[42%] h-[55%] w-[55%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-glow/30 blur-3xl" />
      <div className="absolute bottom-[8%] left-1/2 h-24 w-[70%] -translate-x-1/2 rounded-[100%] bg-violet-glow/20 blur-2xl" />

      {/* Radar rings */}
      <div
        className="absolute bottom-[12%] left-1/2 h-36 w-36 -translate-x-1/2 rounded-full border border-violet-glow/45"
        style={{ animation: "radar-pulse 3.4s ease-out infinite" }}
      />
      <div
        className="absolute bottom-[12%] left-1/2 h-36 w-36 -translate-x-1/2 rounded-full border border-violet-glow/30"
        style={{ animation: "radar-pulse 3.4s ease-out 1.7s infinite" }}
      />

      {/* 3D holographic stage */}
      <div className="animate-float-slow absolute inset-[4%] z-10">
        <div
          className="h-full w-full"
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateX(12deg) rotateY(-8deg)",
          }}
        >
          <svg
            viewBox="0 0 520 520"
            className="h-full w-full drop-shadow-[0_0_50px_rgba(168,85,247,0.55)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="shieldFill" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#c084fc" stopOpacity="0.35" />
                <stop offset="45%" stopColor="#7b2ff7" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#4c1d95" stopOpacity="0.45" />
              </linearGradient>
              <linearGradient id="shieldStroke" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e9d5ff" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#6d28d9" />
              </linearGradient>
              <linearGradient id="handFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.15" />
              </linearGradient>
              <radialGradient id="coreGlow" cx="50%" cy="42%" r="40%">
                <stop offset="0%" stopColor="#e9d5ff" stopOpacity="0.55" />
                <stop offset="55%" stopColor="#a855f7" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#7b2ff7" stopOpacity="0" />
              </radialGradient>
              <pattern id="mesh" width="14" height="14" patternUnits="userSpaceOnUse">
                <path d="M14 0H0V14" stroke="#c084fc" strokeOpacity="0.28" strokeWidth="0.7" />
              </pattern>
              <clipPath id="shieldClip">
                <path d="M260 58 L390 110 V230 C390 330 330 395 260 430 C190 395 130 330 130 230 V110 Z" />
              </clipPath>
              <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Holographic pedestal */}
            <ellipse cx="260" cy="455" rx="118" ry="18" fill="#a855f7" fillOpacity="0.18" />
            <ellipse
              cx="260"
              cy="455"
              rx="118"
              ry="18"
              stroke="#c084fc"
              strokeOpacity="0.55"
              strokeWidth="1.5"
            />
            <ellipse
              cx="260"
              cy="455"
              rx="78"
              ry="10"
              stroke="#e9d5ff"
              strokeOpacity="0.35"
              strokeWidth="1"
              className="animate-holo-spin"
              style={{ transformOrigin: "260px 455px" }}
            />

            {/* Protective hands */}
            <g filter="url(#softGlow)" opacity="0.9">
              <path
                d="M118 390 C95 370 88 340 110 320 C130 305 155 318 168 340 C178 360 190 385 210 402 C185 415 150 415 118 390 Z"
                fill="url(#handFill)"
                stroke="#c4b5fd"
                strokeWidth="1.4"
                strokeOpacity="0.7"
              />
              <path
                d="M402 390 C425 370 432 340 410 320 C390 305 365 318 352 340 C342 360 330 385 310 402 C335 415 370 415 402 390 Z"
                fill="url(#handFill)"
                stroke="#c4b5fd"
                strokeWidth="1.4"
                strokeOpacity="0.7"
              />
            </g>

            {/* Outer shield glow */}
            <path
              d="M260 48 L405 105 V235 C405 345 338 418 260 455 C182 418 115 345 115 235 V105 Z"
              fill="url(#coreGlow)"
              opacity="0.7"
            />

            {/* Main shield body */}
            <g filter="url(#softGlow)">
              <path
                d="M260 58 L390 110 V230 C390 330 330 395 260 430 C190 395 130 330 130 230 V110 Z"
                fill="url(#shieldFill)"
                stroke="url(#shieldStroke)"
                strokeWidth="2.5"
              />
              <g clipPath="url(#shieldClip)">
                <rect width="520" height="520" fill="url(#mesh)" />
                {/* Scanning band */}
                <rect
                  x="120"
                  y="0"
                  width="280"
                  height="42"
                  fill="#e9d5ff"
                  fillOpacity="0.12"
                  className="animate-scan-band"
                />
              </g>
              {/* Inner rim */}
              <path
                d="M260 78 L370 122 V228 C370 312 322 368 260 398 C198 368 150 312 150 228 V122 Z"
                stroke="#e9d5ff"
                strokeOpacity="0.35"
                strokeWidth="1.2"
              />
            </g>

            {/* Child silhouette (stylized, light-particle feel) */}
            <g fill="#e9d5ff" filter="url(#softGlow)">
              <circle cx="260" cy="195" r="28" fillOpacity="0.85" />
              <path
                d="M210 320 C214 268 230 245 260 245 C290 245 306 268 310 320 C292 338 278 348 260 348 C242 348 228 338 210 320 Z"
                fillOpacity="0.8"
              />
              {/* Soft particle dots around figure */}
              <circle cx="232" cy="210" r="2.2" fillOpacity="0.55" />
              <circle cx="288" cy="218" r="1.8" fillOpacity="0.45" />
              <circle cx="248" cy="168" r="1.6" fillOpacity="0.5" />
              <circle cx="275" cy="172" r="1.4" fillOpacity="0.4" />
              <circle cx="240" cy="300" r="1.8" fillOpacity="0.35" />
              <circle cx="280" cy="295" r="2" fillOpacity="0.4" />
            </g>

            {/* Connection traces */}
            <g stroke="#a855f7" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="4 6">
              <path d="M160 140 C120 160 95 200 90 250" className="animate-trace-dash" />
              <path d="M360 140 C400 160 425 200 430 250" className="animate-trace-dash" />
              <path d="M200 400 C170 430 140 445 110 450" className="animate-trace-dash" />
              <path d="M320 400 C350 430 380 445 410 450" className="animate-trace-dash" />
            </g>
          </svg>
        </div>
      </div>

      {/* Orbiting module tiles */}
      {ORBIT.map(({ Icon, top, left, delay }, i) => (
        <div
          key={i}
          className="animate-float-slow absolute z-20 grid h-11 w-11 place-items-center rounded-xl border border-violet-glow/40 bg-surface/70 backdrop-blur-md"
          style={{
            top,
            left,
            animationDelay: delay,
            boxShadow: "0 0 24px -6px rgba(168,85,247,0.85), inset 0 0 12px rgba(168,85,247,0.15)",
            transform: "translateZ(40px)",
          }}
        >
          <Icon className="h-5 w-5 text-violet-glow" />
        </div>
      ))}
    </div>
  );
}
