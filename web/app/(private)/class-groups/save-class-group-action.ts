'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ZodIssue } from 'zod';

import { Api } from '@/lib/api';
import type { ClassGroupFormMode, ClassGroupFormValues } from '@/lib/validations/class-group-form';
import { parseClassGroupFormForServer } from '@/lib/validations/class-group-form';
import { ApiError } from '@/services/api-client';

export type SaveClassGroupActionResult =
  | { success: true }
  | {
      success: false;
      message: string;
      fieldErrors?: Partial<Record<keyof ClassGroupFormValues, string>>;
    };

function flattenZodFieldErrors(
  issues: ZodIssue[],
): Partial<Record<keyof ClassGroupFormValues, string>> {
  const out: Partial<Record<keyof ClassGroupFormValues, string>> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (
      key === 'name' ||
      key === 'modality_id' ||
      key === 'teacher_person_id' ||
      key === 'max_capacity' ||
      key === 'weekdays' ||
      key === 'starts_at' ||
      key === 'ends_at' ||
      key === 'plan_ids'
    ) {
      if (!out[key]) out[key] = issue.message;
    }
  }
  return out;
}

function mapApiValidationToFields(
  errors: Record<string, string[]> | undefined,
): Partial<Record<keyof ClassGroupFormValues, string>> {
  if (!errors) return {};
  const map: Record<string, keyof ClassGroupFormValues> = {
    name: 'name',
    modality_id: 'modality_id',
    teacher_person_id: 'teacher_person_id',
    max_capacity: 'max_capacity',
    weekdays: 'weekdays',
    starts_at: 'starts_at',
    ends_at: 'ends_at',
    plan_ids: 'plan_ids',
  };
  const out: Partial<Record<keyof ClassGroupFormValues, string>> = {};
  for (const [apiKey, messages] of Object.entries(errors)) {
    const formKey = map[apiKey];
    if (formKey && messages?.[0]) out[formKey] = messages[0];
    if (apiKey.startsWith('weekdays.')) {
      if (messages?.[0]) out.weekdays = messages[0];
    }
    if (apiKey === 'plan_ids' || apiKey.startsWith('plan_ids.')) {
      if (messages?.[0]) out.plan_ids = messages[0];
    }
  }
  return out;
}

export async function saveClassGroupAction(input: {
  mode: ClassGroupFormMode;
  classGroupId?: number;
  values: ClassGroupFormValues;
}): Promise<SaveClassGroupActionResult> {
  const parsed = parseClassGroupFormForServer(input.values);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Verifique os campos destacados.',
      fieldErrors: flattenZodFieldErrors(parsed.error.issues),
    };
  }

  const data = parsed.data;
  const body: Record<string, unknown> = {
    name: data.name.trim(),
    modality_id: data.modality_id,
    teacher_person_id: data.teacher_person_id,
    weekdays: data.weekdays,
    starts_at: data.starts_at,
    ends_at: data.ends_at,
  };
  if (data.max_capacity === null) {
    body.max_capacity = null;
  } else {
    body.max_capacity = data.max_capacity;
  }
  body.plan_ids = data.plan_ids;

  try {
    if (input.mode === 'create') {
      const api = new Api('/class-groups');
      await api.post(body);
    } else {
      if (input.classGroupId === undefined) {
        return { success: false, message: 'Identificador ausente.' };
      }
      const api = new Api(`/class-groups/${input.classGroupId}`);
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

  revalidatePath('/class-groups');
  redirect('/class-groups?updated=1');
}
