import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

const MAX_AGE = 60 * 60 * 24 * 7;

export type User = {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
};

export type LoginResponse = { success: boolean; error?: string };
export type LoginRequest = { email: string; password: string };
export type RegisterRequest = {
  user: { email: string; password: string };
  company: { name: string; email: string; phone: string };
};
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
    return { error: "E-mail ou senha inválidos.", success: false };
  }
}

export async function registerAction(
  request: RegisterRequest,
): Promise<RegisterResponse> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      },
    );

    if (!res.ok) {
      return { error: "Erro ao registrar usuário.", success: false };
    }

    return { success: true };
  } catch (error) {
    return { error: "Erro ao registrar usuário.", success: false };
  }
}

export async function logoutAction() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  redirect("/sign-in");
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
    const user = (json?.data ?? json) as Partial<User> | null;
    if (!user) return null;

    if (typeof user?.name !== "string" || typeof user?.email !== "string") {
      return null;
    }

    return {
      ...(user as Omit<User, "id">),
      id: user.id !== undefined ? String(user.id) : "",
    } as User;
  } catch {
    return null;
  }
}

const getUserCached = cache(fetchUserFromServer);

export async function getUser(): Promise<User | null> {
  return getUserCached();
}
