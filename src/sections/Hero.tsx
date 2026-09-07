import { CheckCircle2, Play } from "lucide-react";
import { motion } from "framer-motion";
import { GradientLink } from "@/components/landing/GradientButton";
import { HeroIllustration } from "@/components/landing/HeroIllustration";
import { ParticleField } from "@/components/landing/ParticleField";

const BULLETS = [
  "AI Evidence Analysis",
  "Relationship Mapping",
  "Smart Search",
  "Automated Reports",
];

export function HeroSection() {
  return (
    <section id="home" className="relative overflow-hidden pt-28 sm:pt-32">
      <ParticleField />
      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 lg:grid-cols-2 lg:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            AI-Powered Digital <span className="text-gradient-brand">Investigation</span> Platform
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Manage, analyze, and investigate digital evidence faster using Artificial Intelligence.
          </p>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {BULLETS.map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm text-foreground/90">
                <CheckCircle2 className="h-4 w-4 text-success" />
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <GradientLink to="/register">Get Started</GradientLink>
            <GradientLink to="/dashboard" variant="secondary">
              <Play className="h-4 w-4" /> Watch Demo
            </GradientLink>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="animate-float-slow"
        >
          <HeroIllustration />
        </motion.div>
      </div>
    </section>
  );
}
