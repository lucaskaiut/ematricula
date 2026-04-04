"use client";

import { Menu } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  SidebarProvider,
  useSidebar,
} from "@/components/sidebar/sidebar-provider";
import { Sidebar } from "@/components/sidebar/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

function ShellInner({ children }: { children: React.ReactNode }) {
  const { isOpen, toggle } = useSidebar();

  return (
    <div className="min-h-dvh bg-background">
      <div className="flex min-h-dvh">
        <div
          className={cn(
            "hidden overflow-hidden bg-card transition-[width] duration-300 ease-out lg:block",
            isOpen ? "w-[280px]" : "w-0",
          )}
          aria-hidden={!isOpen}
        >
          <Sidebar />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 shrink-0 border-b border-border bg-nav-surface backdrop-blur-md">
            <div className="flex h-14 items-center gap-3 px-4 justify-between">
              <button
                type="button"
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-control bg-card text-foreground shadow-input transition-transform duration-200",
                  isOpen && "scale-[0.98]",
                )}
                onClick={toggle}
                aria-label={isOpen ? "Esconder menu" : "Mostrar menu"}
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2">
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        </div>
      </div>

      <div className="lg:hidden">
        <Sidebar />
      </div>
    </div>
  );
}

export function AuthedShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <ShellInner>{children}</ShellInner>
    </SidebarProvider>
  );
}
