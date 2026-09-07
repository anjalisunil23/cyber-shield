import { ClipboardList, Cloud, Fingerprint, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { GlassCard } from "@/components/landing/GlassCard";
import { SectionHeading } from "@/components/landing/SectionHeading";

const ITEMS = [
  {
    Icon: Lock,
    title: "AES-256 Encryption",
    desc: "Evidence at rest and in transit protected with industry-standard encryption.",
  },
  {
    Icon: KeyRound,
    title: "Role-Based Access Control",
    desc: "Investigator, forensic officer, supervisor, and admin permissions.",
  },
  {
    Icon: Fingerprint,
    title: "JWT Authentication",
    desc: "Signed tokens with role claims for secure API access.",
  },
  {
    Icon: ClipboardList,
    title: "Audit Logs",
    desc: "Track who accessed, exported, or approved every case artifact.",
  },
  {
    Icon: Cloud,
    title: "Secure Cloud Storage",
    desc: "Isolated case containers with integrity checks on every upload.",
  },
  {
    Icon: ShieldCheck,
    title: "Data Integrity",
    desc: "Hash verification and provenance chains for courtroom readiness.",
  },
];

export function SecuritySection() {
  return (
    <section id="security" className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHeading
          eyebrow="Security"
          title="Enterprise-grade protection by design"
          description="CyberShield treats evidence custody and access control as first-class requirements."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((item, i) => (
            <GlassCard key={item.title} transition={{ delay: i * 0.05 }}>
              <item.Icon className="h-6 w-6 text-cyan" />
              <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
