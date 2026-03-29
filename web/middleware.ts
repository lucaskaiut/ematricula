import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/cookie-names";

const PUBLIC_PATHS = new Set(["/sign-in", "/register"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  const isPublic = PUBLIC_PATHS.has(pathname);

  if (token && isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!token && pathname === "/") {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/sign-in", "/register"],
};
