'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ZodIssue } from 'zod';

import { Api } from '@/lib/api';
import type { ModalityFormMode, ModalityFormValues } from '@/lib/validations/modality-form';
import { parseModalityFormForServer } from '@/lib/validations/modality-form';
import { ApiError } from '@/services/api-client';

export type SaveModalityActionResult =
  | { success: true }
  | {
      success: false;
      message: string;
      fieldErrors?: Partial<Record<keyof ModalityFormValues, string>>;
    };

const keys: (keyof ModalityFormValues)[] = ['name', 'description'];

function flattenZodFieldErrors(
  issues: ZodIssue[],
): Partial<Record<keyof ModalityFormValues, string>> {
  const out: Partial<Record<keyof ModalityFormValues, string>> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (key === 'name' || key === 'description') {
      if (!out[key]) out[key] = issue.message;
    }
  }
  return out;
}

function mapApiValidationToFields(
  errors: Record<string, string[]> | undefined,
): Partial<Record<keyof ModalityFormValues, string>> {
  if (!errors) return {};
  const map: Record<string, keyof ModalityFormValues> = {
    name: 'name',
    description: 'description',
  };
  const out: Partial<Record<keyof ModalityFormValues, string>> = {};
  for (const [apiKey, messages] of Object.entries(errors)) {
    const formKey = map[apiKey];
    if (formKey && messages?.[0]) out[formKey] = messages[0];
  }
  return out;
}

export async function saveModalityAction(input: {
  mode: ModalityFormMode;
  modalityId?: number;
  values: ModalityFormValues;
}): Promise<SaveModalityActionResult> {
  const parsed = parseModalityFormForServer(input.values);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Verifique os campos destacados.',
      fieldErrors: flattenZodFieldErrors(parsed.error.issues),
    };
  }

  const name = parsed.data.name.trim();
  const description = parsed.data.description.trim();
  const body = {
    name,
    description: description === '' ? null : description,
  };

  try {
    if (input.mode === 'create') {
      const api = new Api('/modalities');
      await api.post(body);
    } else {
      if (input.modalityId === undefined) {
        return { success: false, message: 'Identificador ausente.' };
      }
      const api = new Api(`/modalities/${input.modalityId}`);
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

  revalidatePath('/modalidades');
  redirect('/modalidades?updated=1');
}
