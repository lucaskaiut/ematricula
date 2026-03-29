import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE, AUTH_USER_COOKIE } from "@/lib/auth/cookie-names";
import type { PublicUser } from "@/types/api";

const WEEK_SEC = 60 * 60 * 24 * 7;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WEEK_SEC,
  };
}

export async function getServerSession(): Promise<{
  user: PublicUser | null;
  token: string | null;
}> {
  const jar = await cookies();
  const token = jar.get(AUTH_TOKEN_COOKIE)?.value ?? null;
  const raw = jar.get(AUTH_USER_COOKIE)?.value;
  if (!raw) {
    return { user: null, token };
  }
  try {
    const user = JSON.parse(raw) as PublicUser;
    if (
      typeof user?.id === "number" &&
      typeof user?.email === "string" &&
      typeof user?.name === "string"
    ) {
      return { user, token };
    }
  } catch {
    return { user: null, token };
  }
  return { user: null, token };
}

export async function setAuthCookies(user: PublicUser, token: string) {
  const jar = await cookies();
  jar.set(AUTH_TOKEN_COOKIE, token, cookieOptions());
  jar.set(AUTH_USER_COOKIE, JSON.stringify(user), cookieOptions());
}

export async function clearAuthCookies() {
  const jar = await cookies();
  jar.delete(AUTH_TOKEN_COOKIE);
  jar.delete(AUTH_USER_COOKIE);
}
