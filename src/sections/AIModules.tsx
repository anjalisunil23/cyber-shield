import {
  AudioLines,
  Bot,
  Eye,
  FileScan,
  ScanFace,
  ScanText,
  ShieldAlert,
  Timer,
} from "lucide-react";
import { GlassCard } from "@/components/landing/GlassCard";
import { SectionHeading } from "@/components/landing/SectionHeading";

const MODULES = [
  {
    Icon: ScanText,
    title: "OCR",
    desc: "Extract text from images, screenshots, and scanned documents.",
  },
  {
    Icon: ScanFace,
    title: "Face Detection",
    desc: "Cluster and match faces across case media libraries.",
  },
  {
    Icon: Eye,
    title: "Object Detection",
    desc: "Identify vehicles, weapons, logos, and scene objects.",
  },
  {
    Icon: AudioLines,
    title: "Speech-to-Text",
    desc: "Transcribe audio and video dialogue for searchable review.",
  },
  {
    Icon: FileScan,
    title: "Entity Recognition",
    desc: "Pull names, phones, IDs, locations, and accounts.",
  },
  {
    Icon: Timer,
    title: "Timeline Reconstruction",
    desc: "Rebuild chronological event sequences automatically.",
  },
  {
    Icon: ShieldAlert,
    title: "Risk Prediction",
    desc: "Score leads with explainable contributing signals.",
  },
  {
    Icon: Bot,
    title: "AI Investigation Assistant",
    desc: "Ask natural-language questions against case evidence.",
  },
];

export function AIModulesSection() {
  return (
    <section id="ai-modules" className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHeading
          eyebrow="AI Modules"
          title={
            <>
              Purpose-built models for <span className="text-gradient-brand">digital evidence</span>
            </>
          }
          description="Modular AI capabilities that plug into every investigation workflow."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map(({ Icon, title, desc }, i) => (
            <GlassCard key={title} className="p-5" transition={{ delay: i * 0.04, duration: 0.45 }}>
              <Icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
