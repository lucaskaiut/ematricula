"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessPath } from "@/lib/acl/can";
import { ROUTE_ACCESS_RULES } from "@/lib/acl/route-permissions";

export function RouteAccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const redirected = useRef(false);

  useEffect(() => {
    redirected.current = false;
  }, [pathname]);

  useEffect(() => {
    if (!user) {
      return;
    }
    if (pathname === "/403") {
      return;
    }
    if (canAccessPath(user, pathname, ROUTE_ACCESS_RULES)) {
      return;
    }
    if (redirected.current) {
      return;
    }
    redirected.current = true;
    router.replace("/403");
  }, [user, pathname, router]);

  if (user && pathname !== "/403" && !canAccessPath(user, pathname, ROUTE_ACCESS_RULES)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-secondary">
        <p>Verificando permissões…</p>
      </div>
    );
  }

  return <>{children}</>;
}
