'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ZodIssue } from 'zod';

import { Api } from '@/lib/api';
import type { PersonFormMode, PersonFormValues } from '@/lib/validations/person-form';
import { parsePersonFormForServer } from '@/lib/validations/person-form';
import { ApiError } from '@/services/api-client';
import type { PersonProfile } from '@/types/api';

export type SavePersonActionResult =
  | { success: true }
  | {
      success: false;
      message: string;
      fieldErrors?: Partial<Record<keyof PersonFormValues, string>>;
    };

const fieldKeys: (keyof PersonFormValues)[] = [
  'full_name',
  'birth_date',
  'cpf',
  'phone',
  'email',
  'guardian_person_id',
  'status',
  'notes',
];

function flattenZodFieldErrors(
  issues: ZodIssue[],
): Partial<Record<keyof PersonFormValues, string>> {
  const out: Partial<Record<keyof PersonFormValues, string>> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && fieldKeys.includes(key as keyof PersonFormValues)) {
      const k = key as keyof PersonFormValues;
      if (!out[k]) out[k] = issue.message;
    }
  }
  return out;
}

function mapApiValidationToFields(
  errors: Record<string, string[]> | undefined,
): Partial<Record<keyof PersonFormValues, string>> {
  if (!errors) return {};
  const map: Record<string, keyof PersonFormValues> = {
    full_name: 'full_name',
    birth_date: 'birth_date',
    cpf: 'cpf',
    phone: 'phone',
    email: 'email',
    guardian_person_id: 'guardian_person_id',
    status: 'status',
    notes: 'notes',
  };
  const out: Partial<Record<keyof PersonFormValues, string>> = {};
  for (const [apiKey, messages] of Object.entries(errors)) {
    const formKey = map[apiKey];
    if (formKey && messages?.[0]) out[formKey] = messages[0];
  }
  return out;
}

function buildPayload(
  data: PersonFormValues,
  profile: PersonProfile,
): Record<string, unknown> {
  const cpf = data.cpf.trim() === '' ? null : data.cpf.replace(/\D/g, '');
  const guardianRaw = data.guardian_person_id?.trim() ?? '';
  const guardian_person_id =
    profile === 'teacher'
      ? null
      : guardianRaw === ''
        ? null
        : Number(guardianRaw);

  return {
    full_name: data.full_name.trim(),
    birth_date: data.birth_date,
    cpf,
    phone: data.phone.replace(/\D/g, ''),
    email: data.email.trim().toLowerCase(),
    guardian_person_id,
    status: data.status,
    notes: data.notes.trim() === '' ? null : data.notes.trim(),
    profile,
  };
}

export async function savePersonAction(input: {
  mode: PersonFormMode;
  profile: PersonProfile;
  listPath: string;
  personId?: number;
  values: PersonFormValues;
}): Promise<SavePersonActionResult> {
  const parsed = parsePersonFormForServer(input.values, input.profile);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Verifique os campos destacados.',
      fieldErrors: flattenZodFieldErrors(parsed.error.issues),
    };
  }

  const body = buildPayload(parsed.data, input.profile);

  try {
    if (input.mode === 'create') {
      const api = new Api('/persons');
      await api.post(body);
    } else {
      if (input.personId === undefined) {
        return { success: false, message: 'Identificador ausente.' };
      }
      const api = new Api(`/persons/${input.personId}`);
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

  revalidatePath(input.listPath);
  redirect(`${input.listPath}?updated=1`);
}
