import { Bot, Gauge, LockKeyhole, Rocket } from "lucide-react";
import { GlassCard } from "@/components/landing/GlassCard";
import { SectionHeading } from "@/components/landing/SectionHeading";

const REASONS = [
  {
    Icon: Gauge,
    title: "Faster Investigations",
    desc: "Cut manual review time with AI triage, smart search, and auto-classification.",
  },
  {
    Icon: Bot,
    title: "AI-Powered Automation",
    desc: "From OCR to lead scoring — automation that stays explainable and reviewable.",
  },
  {
    Icon: LockKeyhole,
    title: "Secure Evidence Management",
    desc: "Chain-of-custody friendly workflows with encryption and audit trails.",
  },
  {
    Icon: Rocket,
    title: "Scalable Enterprise Platform",
    desc: "Built to grow with unit caseloads, teams, and multi-agency collaboration.",
  },
];

export function WhyCyberShieldSection() {
  return (
    <section id="about" className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHeading
          eyebrow="Why CyberShield"
          title="Built for modern digital investigations"
          description="A focused platform for authorized investigators who need speed without sacrificing oversight."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {REASONS.map((r, i) => (
            <GlassCard key={r.title} className="flex gap-4" transition={{ delay: i * 0.06 }}>
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/10">
                <r.Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{r.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{r.desc}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
