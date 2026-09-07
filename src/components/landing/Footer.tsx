import { Github, Linkedin, Mail, Shield, Twitter } from "lucide-react";
import { Link } from "@tanstack/react-router";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "AI Modules", href: "#ai-modules" },
      { label: "Dashboard", href: "#dashboard" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#faq" },
      { label: "GitHub", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
      { label: "Login", href: "/login" },
      { label: "Get Started", href: "/register" },
    ],
  },
];

export function Footer() {
  return (
    <footer id="contact" className="border-t border-white/10 bg-[#020617]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.2fr_2fr]">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-cyan">
              <Shield className="h-5 w-5 text-white" />
            </span>
            <span className="text-lg font-bold">
              Cyber<span className="text-gradient-brand">Shield</span>
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            AI-powered investigation support for digital evidence case management — built for
            authorized investigators and forensic teams.
          </p>
          <div className="mt-5 flex gap-3">
            {[Twitter, Github, Linkedin, Mail].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                aria-label="Social link"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-foreground">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith("/") ? (
                      <Link
                        to={l.href as "/login" | "/register"}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    ) : (
                      <a
                        href={l.href}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} CyberShield · Synthetic data only — research & demonstration.
      </div>
    </footer>
  );
}
