import { setAuthCookies, clearAuthCookies } from "@/lib/auth/session";
import { createServerAuthService } from "@/services/auth-service";
import { ApiError } from "@/services/api-client";
import type { LoginRequestBody, RegisterRequestBody, PublicUser } from "@/types/api";

export type AuthActionFailure = {
  ok: false;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type AuthActionSuccess = { ok: true };

export type LoginActionResult = AuthActionSuccess | AuthActionFailure;

export type RegisterActionResult = AuthActionSuccess | AuthActionFailure;

function flattenFieldErrors(
  errors: Record<string, string[]> | undefined,
): Record<string, string[]> | undefined {
  if (!errors) return undefined;
  return errors;
}

export async function loginAction(input: LoginRequestBody): Promise<LoginActionResult> {
  try {
    const auth = createServerAuthService();
    const json = await auth.login({
      email: input.email.trim(),
      password: input.password,
    });
    const token = json.data.token;
    if (!token) {
      return { ok: false, message: "Resposta da API sem token de sessão." };
    }
    const user: PublicUser = {
      id: json.data.id,
      name: json.data.name,
      email: json.data.email,
    };
    await setAuthCookies(user, token);
    return { ok: true };
  } catch (e) {
    if (e instanceof ApiError) {
      return {
        ok: false,
        message: e.message,
        fieldErrors: flattenFieldErrors(e.validation?.errors),
      };
    }
    return { ok: false, message: "Não foi possível iniciar sessão." };
  }
}

export async function registerAction(
  input: RegisterRequestBody,
): Promise<RegisterActionResult> {
  try {
    const auth = createServerAuthService();
    await auth.register({
      company: {
        name: input.company.name.trim(),
        email: input.company.email.trim(),
        phone: input.company.phone.trim(),
      },
      user: {
        name: input.user.name.trim(),
        email: input.user.email.trim(),
        password: input.user.password,
      },
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof ApiError) {
      return {
        ok: false,
        message: e.message,
        fieldErrors: flattenFieldErrors(e.validation?.errors),
      };
    }
    return { ok: false, message: "Não foi possível concluir o registo." };
  }
}

export async function logoutAction(): Promise<void> {
  await clearAuthCookies();
}
