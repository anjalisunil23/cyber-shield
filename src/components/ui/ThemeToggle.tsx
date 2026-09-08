import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "relative grid h-10 w-10 place-items-center rounded-xl border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        "border-border bg-card text-foreground hover:border-primary/40 hover:text-primary",
        className,
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="sr-only">{isDark ? "Switch to light mode" : "Switch to dark mode"}</span>
      <div className="relative h-4 w-4">
        <Sun
          className={cn(
            "absolute inset-0 h-4 w-4 text-amber-500 transition-transform duration-300",
            isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100",
          )}
        />
        <Moon
          className={cn(
            "absolute inset-0 h-4 w-4 text-cyan transition-transform duration-300",
            isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0",
          )}
        />
      </div>
    </button>
  );
}

export function ThemeSwitch({
  label = "Dark mode",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between gap-3 text-sm text-foreground",
        className,
      )}
    >
      <span>{label}</span>
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          checked={isDark}
          onChange={toggleTheme}
          className="peer sr-only"
          aria-label={label}
        />
        <div className="h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50 dark:bg-slate-700" />
        <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
      </div>
    </label>
  );
}
