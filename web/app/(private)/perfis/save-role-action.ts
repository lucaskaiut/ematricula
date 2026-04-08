"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ZodIssue } from "zod";

import { Api } from "@/lib/api";
import type { RoleFormValues } from "@/lib/validations/role-form";
import { parseRoleFormForServer } from "@/lib/validations/role-form";
import { ApiError } from "@/services/api-client";

export type SaveRoleActionResult =
  | { success: true }
  | {
      success: false;
      message: string;
      fieldErrors?: Partial<Record<keyof RoleFormValues, string>>;
    };

function flattenZodFieldErrors(
  issues: ZodIssue[],
): Partial<Record<keyof RoleFormValues, string>> {
  const out: Partial<Record<keyof RoleFormValues, string>> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (key === "name" || key === "description" || key === "permissions") {
      if (!out[key]) out[key] = issue.message;
    }
  }
  return out;
}

function mapApiValidationToFields(
  errors: Record<string, string[]> | undefined,
): Partial<Record<keyof RoleFormValues, string>> {
  if (!errors) return {};
  const map: Record<string, keyof RoleFormValues> = {
    name: "name",
    description: "description",
    permissions: "permissions",
  };
  const out: Partial<Record<keyof RoleFormValues, string>> = {};
  for (const [apiKey, messages] of Object.entries(errors)) {
    const formKey = map[apiKey];
    if (formKey && messages?.[0]) out[formKey] = messages[0];
  }
  return out;
}

export async function saveRoleAction(input: {
  mode: "create" | "edit";
  roleId?: number;
  values: RoleFormValues;
}): Promise<SaveRoleActionResult> {
  const parsed = parseRoleFormForServer(input.values);
  if (!parsed.success) {
    return {
      success: false,
      message: "Verifique os campos destacados.",
      fieldErrors: flattenZodFieldErrors(parsed.error.issues),
    };
  }

  const { name, description, permissions } = parsed.data;
  const descriptionTrimmed = description.trim();

  const body = {
    name,
    description: descriptionTrimmed === "" ? null : descriptionTrimmed,
    permissions,
  };

  try {
    if (input.mode === "create") {
      const api = new Api("/roles");
      await api.post(body);
    } else {
      if (input.roleId === undefined) {
        return { success: false, message: "Identificador do perfil ausente." };
      }
      const api = new Api(`/roles/${input.roleId}`);
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
      message: e instanceof Error ? e.message : "Não foi possível salvar.",
    };
  }

  revalidatePath("/perfis");
  redirect("/perfis?updated=1");
}
