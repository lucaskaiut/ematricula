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
  };
}

export function createServerAuthService(getToken?: () => string | undefined) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL não está definida");
  }
  const client = createApiClient({ baseUrl, getToken });
  return createAuthService(client);
}
