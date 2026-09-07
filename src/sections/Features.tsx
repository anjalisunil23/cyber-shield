import { FileImage, FileText, FolderOpen, Mail, Network, Video } from "lucide-react";
import { GlassCard } from "@/components/landing/GlassCard";
import { SectionHeading } from "@/components/landing/SectionHeading";

const FEATURES = [
  {
    Icon: FolderOpen,
    title: "Evidence Management",
    desc: "Securely upload, tag, and organize images, videos, chats, emails, documents, and call logs in one case workspace.",
  },
  {
    Icon: FileImage,
    title: "AI Image Analysis",
    desc: "Detect faces, objects, text, and anomalies across seized media with explainable AI findings.",
  },
  {
    Icon: Video,
    title: "Video Investigation",
    desc: "Timeline scrubbing, frame extraction, and event detection to accelerate video review.",
  },
  {
    Icon: Mail,
    title: "Chat & Email Analysis",
    desc: "Parse conversations, extract entities, and surface high-risk communications automatically.",
  },
  {
    Icon: Network,
    title: "Relationship Mapping",
    desc: "Visualize how people, devices, locations, and accounts interconnect across evidence sources.",
  },
  {
    Icon: FileText,
    title: "AI Report Generator",
    desc: "Produce structured, reviewable investigation reports with provenance back to source files.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHeading
          eyebrow="Capabilities"
          title={
            <>
              Everything investigators need in{" "}
              <span className="text-gradient-brand">one platform</span>
            </>
          }
          description="Six connected modules designed for digital evidence case management — from seizure to defensible reporting."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ Icon, title, desc }, i) => (
            <GlassCard key={title} transition={{ delay: i * 0.05, duration: 0.5 }}>
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-primary/30 bg-primary/10">
                <Icon className="h-5 w-5 text-cyan" />
              </div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
