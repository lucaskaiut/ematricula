import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

const MAX_AGE = 60 * 60 * 24 * 7;

export type AuthedUserRole = {
  id: number;
  name: string;
};

export type AuthedUser = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  role?: AuthedUserRole | null;
  permissions: string[];
};

export type User = AuthedUser;

export type LoginResponse = { success: boolean; error?: string };
export type LoginRequest = { email: string; password: string };
export type RegisterResponse = { success: boolean; error?: string };

export async function loginAction(
  request: LoginRequest,
): Promise<LoginResponse> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      return { error: "E-mail ou senha inválidos.", success: false };
    }

    const { data } = await res.json();

    const cookieStore = await cookies();
    cookieStore.set("auth_token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE,
    });

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "E-mail ou senha inválidos.", success: false };
  }
}

export async function registerAction(
  formData: FormData,
): Promise<RegisterResponse> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/register`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!res.ok) {
      return { error: "Erro ao registrar usuário.", success: false };
    }

    return { success: true };
  } catch {
    return { error: "Erro ao registrar usuário.", success: false };
  }
}

export async function logoutAction() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  redirect("/sign-in");
}

function normalizePermissions(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((p): p is string => typeof p === "string");
}

async function fetchUserFromServer(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      cookieStore.delete("auth_token");
      return null;
    }

    const json = await res.json();
    const user = (json?.data ?? json) as Partial<User> & {
      role?: AuthedUserRole | null;
      permissions?: unknown;
    } | null;
    if (!user) return null;

    if (typeof user?.name !== "string" || typeof user?.email !== "string") {
      return null;
    }

    const role =
      user.role &&
      typeof user.role === "object" &&
      typeof (user.role as AuthedUserRole).id === "number" &&
      typeof (user.role as AuthedUserRole).name === "string"
        ? {
            id: (user.role as AuthedUserRole).id,
            name: (user.role as AuthedUserRole).name,
          }
        : null;

    const avatarUrl =
      typeof user.avatar_url === "string" && user.avatar_url !== ""
        ? user.avatar_url
        : null;

    return {
      id: user.id !== undefined ? String(user.id) : "",
      name: user.name,
      email: user.email,
      avatar_url: avatarUrl,
      created_at:
        typeof user.created_at === "string" ? user.created_at : "",
      updated_at:
        typeof user.updated_at === "string" ? user.updated_at : "",
      role,
      permissions: normalizePermissions(user.permissions),
    };
  } catch {
    return null;
  }
}

const getUserCached = cache(fetchUserFromServer);

export async function getUser(): Promise<User | null> {
  return getUserCached();
}
