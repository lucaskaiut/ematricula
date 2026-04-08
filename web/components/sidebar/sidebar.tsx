"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { SIDEBAR_ITEMS } from "@/components/sidebar/menu-items";
import { useSidebar } from "@/components/sidebar/sidebar-provider";
import { useAuth } from "@/contexts/AuthContext";
import { userHasAnyPermission } from "@/lib/acl/can";

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
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();

  const nav = (
    <nav className="px-2 py-2">
      <ul className="space-y-1">
        {SIDEBAR_ITEMS.filter((item) =>
          userHasAnyPermission(user, item.anyOf),
        ).map((item) => {
          const active = isActivePath(pathname, item.href, item.match);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-control px-3 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-card-subtle text-foreground border-r-4 border-primary"
                    : "text-secondary hover:bg-card-subtle hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    active
                      ? "text-primary"
                      : "text-muted group-hover:text-primary",
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
          "fixed left-0 top-0 z-50 h-dvh w-[280px] -translate-x-full border-r border-border bg-card shadow-nav transition-transform duration-300 ease-out lg:hidden",
          isOpen && "translate-x-0",
        )}
        aria-hidden={!isOpen}
      >
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-extrabold text-primary">
              eMatrícula
            </div>
            <div className="truncate text-xs font-medium text-muted">
              {user?.name}
            </div>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-control bg-card-subtle text-foreground shadow-input"
            onClick={close}
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {nav}
      </aside>

      <aside className="hidden h-dvh w-full flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-extrabold text-primary">
              eMatrícula
            </div>
            <div className="truncate text-xs font-medium text-muted">
              {user?.name}
            </div>
          </div>
          <LogOut className="text-muted cursor-pointer" onClick={logout}/>
        </div>
        {nav}
      </aside>
    </>
  );
}
