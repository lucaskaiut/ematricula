"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { SIDEBAR_ITEMS } from "@/components/sidebar/menu-items";
import { useSidebar } from "@/components/sidebar/sidebar-provider";

function isActivePath(
  pathname: string,
  href: string,
  match: "exact" | "prefix" | undefined,
) {
  if (match === "exact") return pathname === href;
  if (match === "prefix")
    return pathname === href || pathname.startsWith(`${href}/`);
  return pathname === href;
}

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();

  const nav = (
    <nav className="px-2 py-2">
      <ul className="space-y-1">
        {SIDEBAR_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href, item.match);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-ematricula-control px-3 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-ematricula-card-shell text-ematricula-text-primary border-r-4 border-ematricula-link"
                    : "text-ematricula-text-secondary hover:bg-ematricula-input-muted-bg hover:text-ematricula-text-primary",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    active
                      ? "text-ematricula-link"
                      : "text-ematricula-text-muted group-hover:text-ematricula-link",
                  )}
                />
                <span className="min-w-0 truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-200 lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={close}
      />
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-dvh w-[280px] -translate-x-full border-r border-ematricula-border-input bg-ematricula-surface shadow-ematricula-nav transition-transform duration-300 ease-out lg:hidden",
          isOpen && "translate-x-0",
        )}
        aria-hidden={!isOpen}
      >
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-extrabold text-ematricula-nav-title">
              eMatrícula
            </div>
            <div className="truncate text-xs font-medium text-ematricula-text-muted">
              Área privada
            </div>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-ematricula-control bg-ematricula-input-muted-bg text-ematricula-text-primary shadow-ematricula-input"
            onClick={close}
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {nav}
      </aside>

      <aside className="hidden h-dvh w-full flex-col border-r border-ematricula-border-input bg-ematricula-surface lg:flex">
        <div className="flex h-14 items-center gap-3 px-4">
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-extrabold text-ematricula-nav-title">
              eMatrícula
            </div>
            <div className="truncate text-xs font-medium text-ematricula-text-muted">
              Área privada
            </div>
          </div>
        </div>
        {nav}
      </aside>
    </>
  );
}
