import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_TOKEN_COOKIE, AUTH_USER_COOKIE } from "@/lib/auth/cookie-names";
import { createAuthService } from "@/services/auth-service";
import { ApiError } from "@/services/api-client";
import { createServerApiClient } from "@/lib/auth/server-api";
import type { PublicUser } from "@/types/api";
import { cache } from "react";

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
  if (!token) {
    return { user: null, token: null };
  }
  
  try {
    const client = await createServerApiClient();
    const auth = createAuthService(client);
    const json = await auth.me();
    const u = json.data;
    if (
      typeof u?.id !== "number" ||
      typeof u?.email !== "string" ||
      typeof u?.name !== "string"
    ) {
      return { user: null, token };
    }
    const user: PublicUser = {
      id: u.id,
      name: u.name,
      email: u.email,
    };
    return { user, token };
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
      redirect("/auth/session-expired");
    }
    return { user: null, token };
  }
}

export const getUser = cache(async () => {
  return getServerSession();
});

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
