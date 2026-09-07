import { motion } from "framer-motion";

/** Animated mesh / particles / grid for auth pages. */
export function BackgroundAnimation() {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    left: `${(i * 41) % 100}%`,
    top: `${(i * 53) % 100}%`,
    delay: i * 0.35,
    size: 2 + (i % 3),
  }));

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#020617]" />
      <div className="absolute -left-24 top-0 h-[420px] w-[420px] rounded-full bg-primary/25 blur-[120px]" />
      <div className="absolute right-0 top-1/4 h-[380px] w-[380px] rounded-full bg-cyan/20 blur-[110px]" />
      <div className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-primary/15 blur-[100px]" />

      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(59,130,246,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(59,130,246,0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 70% 70% at 50% 40%, black, transparent)",
        }}
      />

      <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 1000 800" fill="none">
        <path d="M80 120 L220 200 L180 340" stroke="#3B82F6" strokeWidth="1" />
        <path d="M820 140 L700 260 L860 320" stroke="#06B6D4" strokeWidth="1" />
        <path d="M120 620 L280 540 L340 700" stroke="#3B82F6" strokeWidth="1" />
        <circle cx="220" cy="200" r="3" fill="#06B6D4" />
        <circle cx="700" cy="260" r="3" fill="#3B82F6" />
        <circle cx="280" cy="540" r="3" fill="#06B6D4" />
      </svg>

      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-cyan/70"
          style={{ left: p.left, top: p.top, width: p.size, height: p.size }}
          animate={{ y: [0, -40, 0], opacity: [0.2, 0.9, 0.2] }}
          transition={{
            duration: 5 + (i % 4),
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
