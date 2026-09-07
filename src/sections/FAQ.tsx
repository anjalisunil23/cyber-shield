import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { SectionHeading } from "@/components/landing/SectionHeading";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Who is CyberShield designed for?",
    a: "Authorized investigators, forensic officers, supervisors, and admins working on digital evidence case management.",
  },
  {
    q: "Does AI replace human investigators?",
    a: "No. AI output is advisory only. Every lead, score, and report section requires human review and approval.",
  },
  {
    q: "What evidence types are supported?",
    a: "Images, videos, chat exports, emails, documents, call logs, and social media records — with extensible connectors.",
  },
  {
    q: "How is evidence secured?",
    a: "AES-256 encryption, JWT auth, role-based access, audit logs, and integrity hashing protect custody and access.",
  },
  {
    q: "Can CyberShield generate court-ready reports?",
    a: "Yes. Reports include provenance links back to source evidence and are designed for supervisor sign-off.",
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-5">
        <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
        <div className="mt-10 space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-2xl border border-white/10 bg-[rgb(17_24_39/0.75)]"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  {item.q}
                  <ChevronDown
                    className={cn("h-4 w-4 shrink-0 transition", isOpen && "rotate-180 text-cyan")}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <p className="border-t border-white/5 px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
