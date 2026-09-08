import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Shield, X } from "lucide-react";
import { useState } from "react";
import { useScrolled } from "@/hooks/useScrolled";
import { cn } from "@/lib/utils";
import { GradientLink } from "./GradientButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const LINKS = [
  { href: "#home", label: "Home" },
  { href: "#features", label: "Features" },
  { href: "#ai-modules", label: "AI Modules" },
  { href: "/dashboard", label: "Dashboard", route: true },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export function Navbar() {
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "border-b border-border bg-background/80 backdrop-blur-xl" : "bg-transparent",
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
        <a href="#home" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-cyan shadow-[0_0_24px_-6px_rgba(59,130,246,0.8)]">
            <Shield className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Cyber<span className="text-gradient-brand">Shield</span>
          </span>
        </a>

        <div className="hidden items-center gap-7 text-sm text-muted-foreground lg:flex">
          {LINKS.map((l) =>
            "route" in l && l.route ? (
              <Link
                key={l.href}
                to="/dashboard"
                className="transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ) : (
              <a key={l.href} href={l.href} className="transition-colors hover:text-foreground">
                {l.label}
              </a>
            ),
          )}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          <Link
            to="/login"
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-muted"
          >
            Login
          </Link>
          <GradientLink to="/register">Get Started</GradientLink>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-xl border border-border text-foreground hover:bg-muted"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border bg-background/95 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {LINKS.map((l) =>
                "route" in l && l.route ? (
                  <Link
                    key={l.href}
                    to="/dashboard"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                ) : (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {l.label}
                  </a>
                ),
              )}
              <div className="mt-3 flex gap-2">
                <Link
                  to="/login"
                  className="flex-1 rounded-xl border border-border bg-card py-2.5 text-center text-sm font-medium text-foreground hover:bg-muted"
                >
                  Login
                </Link>
                <GradientLink to="/register" className="flex-1">
                  Get Started
                </GradientLink>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
