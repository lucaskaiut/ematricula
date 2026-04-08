'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ZodIssue } from 'zod';

import { Api } from '@/lib/api';
import type { UserFormMode, UserFormValues } from '@/lib/validations/user-form';
import { parseUserFormForServer } from '@/lib/validations/user-form';
import { ApiError } from '@/services/api-client';

export type SaveUserActionResult =
  | { success: true }
  | {
      success: false;
      message: string;
      fieldErrors?: Partial<Record<keyof UserFormValues, string>>;
    };

function flattenZodFieldErrors(issues: ZodIssue[]): Partial<Record<keyof UserFormValues, string>> {
  const out: Partial<Record<keyof UserFormValues, string>> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (key === "name" || key === "email" || key === "password" || key === "role_id") {
      if (!out[key]) out[key] = issue.message;
    }
  }
  return out;
}

function mapApiValidationToFields(
  errors: Record<string, string[]> | undefined,
): Partial<Record<keyof UserFormValues, string>> {
  if (!errors) return {};
  const map: Record<string, keyof UserFormValues> = {
    name: "name",
    email: "email",
    password: "password",
    role_id: "role_id",
  };
  const out: Partial<Record<keyof UserFormValues, string>> = {};
  for (const [apiKey, messages] of Object.entries(errors)) {
    const formKey = map[apiKey];
    if (formKey && messages?.[0]) out[formKey] = messages[0];
  }
  return out;
}

export async function saveUserAction(input: {
  mode: UserFormMode;
  userId?: number;
  values: UserFormValues;
}): Promise<SaveUserActionResult> {
  const parsed = parseUserFormForServer(input.values, input.mode);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Verifique os campos destacados.',
      fieldErrors: flattenZodFieldErrors(parsed.error.issues),
    };
  }

  const { name, email, password, role_id: roleId } = parsed.data;

  try {
    if (input.mode === "create") {
      const api = new Api("/users");
      await api.post({ name, email, password, role_id: roleId });
    } else {
      if (input.userId === undefined) {
        return { success: false, message: "Identificador do usuário ausente." };
      }
      const api = new Api(`/users/${input.userId}`);
      const body: { name: string; email: string; role_id: number; password?: string } = {
        name,
        email,
        role_id: roleId,
      };
      if (password.length > 0) body.password = password;
      await api.patch(body);
    }
  } catch (e) {
    if (e instanceof ApiError) {
      const v = e.validation;
      const fieldErrors = mapApiValidationToFields(v?.errors);
      return {
        success: false,
        message: v?.message ?? e.message,
        fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
      };
    }
    return {
      success: false,
      message: e instanceof Error ? e.message : 'Não foi possível salvar.',
    };
  }

  revalidatePath('/users');
  redirect('/users?updated=1');
}
