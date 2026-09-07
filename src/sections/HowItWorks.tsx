import { BrainCircuit, FileOutput, Layers3, Sparkles, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/landing/SectionHeading";

const STEPS = [
  {
    Icon: Upload,
    title: "Upload Evidence",
    desc: "Ingest multi-format digital evidence securely into a case.",
  },
  {
    Icon: BrainCircuit,
    title: "AI Processing",
    desc: "Models classify, extract, and correlate signals automatically.",
  },
  {
    Icon: Layers3,
    title: "Automatic Classification",
    desc: "Organize media, chats, docs, and logs into structured sets.",
  },
  {
    Icon: Sparkles,
    title: "Investigation Insights",
    desc: "Surface leads, timelines, and relationship graphs.",
  },
  {
    Icon: FileOutput,
    title: "Generate Reports",
    desc: "Export explainable reports ready for human review.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHeading
          eyebrow="Workflow"
          title="How CyberShield works"
          description="A clear path from raw seizure to investigation-ready insights."
        />
        <div className="relative mt-14">
          <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent lg:block" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            {STEPS.map(({ Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative rounded-2xl border border-white/10 bg-[rgb(17_24_39/0.7)] p-5 backdrop-blur"
              >
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-full border border-cyan/30 bg-[#030712] text-cyan shadow-[0_0_24px_-8px_rgba(6,182,212,0.8)]">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Step {i + 1}
                </p>
                <h3 className="mt-2 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
