import { createServerApiClient } from "@/lib/auth/server-api";
import { createApiClient, type ApiClient } from "@/services/api-client";
import type {
  LoginRequestBody,
  RegisterRequestBody,
  UserWrapped,
} from "@/types/api";

export function createAuthService(client: ApiClient) {
  return {
    login(body: LoginRequestBody) {
      return client.post<UserWrapped>("/users/login", { body });
    },
    register(body: RegisterRequestBody) {
      return client.post<UserWrapped>("/users/register", { body });
    },
    me() {
      return client.get<UserWrapped>("/user/me");
    },
  };
}

export async function createServerAuthService() {
  const client = await createServerApiClient();
  return createAuthService(client);
}

export function createPublicAuthService() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL não está definida");
  }
  const client = createApiClient({ baseUrl });
  return createAuthService(client);
}
