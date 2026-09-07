import { motion } from "framer-motion";
import { GradientLink } from "@/components/landing/GradientButton";

export function CTASection() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-white/10 px-6 py-14 text-center sm:px-12"
          style={{
            background:
              "radial-gradient(800px 300px at 20% 0%, rgba(59,130,246,0.35), transparent), radial-gradient(700px 280px at 80% 100%, rgba(6,182,212,0.28), transparent), #111827",
          }}
        >
          <h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Transform Digital Investigations with <span className="text-gradient-brand">AI</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Deploy CyberShield for secure evidence management, explainable AI analysis, and faster
            case outcomes.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <GradientLink to="/register">Get Started</GradientLink>
            <GradientLink href="#contact" variant="secondary">
              Request Demo
            </GradientLink>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
