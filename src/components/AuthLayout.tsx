import { Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import type { ReactNode } from "react";
import { HudAuthCard, HudShell, HudVisualStage } from "./HudShell";

/** Shared auth chrome for pages that still use AuthLayout. */
export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <HudShell>
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:px-10">
        <div className="relative hidden lg:block">
          <HudVisualStage />
        </div>
        <div className="animate-rise-in mx-auto w-full max-w-[460px]">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-white/80 transition-colors hover:text-white lg:hidden"
          >
            <Shield className="h-5 w-5" />
            <span className="font-display text-sm font-semibold tracking-wide">Cyber Shield</span>
          </Link>
          <HudAuthCard>
            <h1 className="text-xl font-semibold tracking-wide text-white">{title}</h1>
            <p className="mt-2 text-sm text-white/60">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </HudAuthCard>
        </div>
      </div>
    </HudShell>
  );
}
