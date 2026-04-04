"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggle = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!mounted}
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-border bg-card text-foreground shadow-input transition-colors hover:bg-accent",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
        "disabled:pointer-events-none disabled:opacity-60",
        className,
      )}
      aria-label={
        mounted
          ? resolvedTheme === "dark"
            ? "Ativar tema claro"
            : "Ativar tema escuro"
          : "Alternar tema claro ou escuro"
      }
    >
      {!mounted ? (
        <span className="h-4 w-4" aria-hidden />
      ) : resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4" aria-hidden />
      ) : (
        <Moon className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}
