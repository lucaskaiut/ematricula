import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/cookie-names";
import { createApiClient } from "@/services/api-client";

export async function createServerApiClient() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL não está definida");
  }
  const jar = await cookies();
  const token = jar.get(AUTH_TOKEN_COOKIE)?.value;
  return createApiClient({
    baseUrl,
    getToken: () => token ?? undefined,
  });
}
