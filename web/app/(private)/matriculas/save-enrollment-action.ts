'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ZodIssue } from 'zod';

import { Api } from '@/lib/api';
import type { EnrollmentFormMode, EnrollmentFormValues } from '@/lib/validations/enrollment-form';
import { parseEnrollmentFormForServer } from '@/lib/validations/enrollment-form';
import type { EnrollmentStatus } from '@/types/api';
import { ApiError } from '@/services/api-client';

export type SaveEnrollmentActionResult =
  | { success: true }
  | {
      success: false;
      message: string;
      fieldErrors?: Partial<Record<keyof EnrollmentFormValues, string>>;
    };

const fieldKeys: (keyof EnrollmentFormValues)[] = [
  'student_person_id',
  'class_group_id',
  'starts_on',
  'ends_on',
  'status',
  'plan_id',
  'billing_starts_on',
];

function flattenZodFieldErrors(
  issues: ZodIssue[],
): Partial<Record<keyof EnrollmentFormValues, string>> {
  const out: Partial<Record<keyof EnrollmentFormValues, string>> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (fieldKeys.includes(key as keyof EnrollmentFormValues)) {
      const k = key as keyof EnrollmentFormValues;
      if (!out[k]) out[k] = issue.message;
    }
  }
  return out;
}

function mapApiValidationToFields(
  errors: Record<string, string[]> | undefined,
): Partial<Record<keyof EnrollmentFormValues, string>> {
  if (!errors) return {};
  const map: Record<string, keyof EnrollmentFormValues> = {
    student_person_id: 'student_person_id',
    class_group_id: 'class_group_id',
    starts_on: 'starts_on',
    ends_on: 'ends_on',
    status: 'status',
    plan_id: 'plan_id',
    billing_starts_on: 'billing_starts_on',
  };
  const out: Partial<Record<keyof EnrollmentFormValues, string>> = {};
  for (const [apiKey, messages] of Object.entries(errors)) {
    const formKey = map[apiKey];
    if (formKey && messages?.[0]) out[formKey] = messages[0];
  }
  return out;
}

export async function saveEnrollmentAction(input: {
  mode: EnrollmentFormMode;
  enrollmentId?: number;
  values: EnrollmentFormValues;
  initialStatusFromApi?: EnrollmentStatus;
}): Promise<SaveEnrollmentActionResult> {
  const parsed = parseEnrollmentFormForServer(input.values, {
    mode: input.mode,
    initialStatusWhenLoaded: input.mode === 'edit' ? input.initialStatusFromApi : undefined,
  });
  if (!parsed.success) {
    return {
      success: false,
      message: 'Verifique os campos destacados.',
      fieldErrors: flattenZodFieldErrors(parsed.error.issues),
    };
  }

  const data = parsed.data;
  const body: Record<string, unknown> = {
    student_person_id: data.student_person_id,
    class_group_id: data.class_group_id,
    starts_on: data.starts_on,
    ends_on: data.ends_on,
    status: data.status,
  };

  if (input.mode === 'create') {
    body.plan_id = data.plan_id;
    body.billing_starts_on = data.billing_starts_on;
  } else {
    if (data.plan_id > 0) {
      body.plan_id = data.plan_id;
    }
    const billing = data.billing_starts_on.trim();
    if (billing !== '') {
      body.billing_starts_on = billing;
    }
  }

  try {
    if (input.mode === 'create') {
      const api = new Api('/enrollments');
      await api.post(body);
    } else {
      if (input.enrollmentId === undefined) {
        return { success: false, message: 'Identificador ausente.' };
      }
      const api = new Api(`/enrollments/${input.enrollmentId}`);
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

  revalidatePath('/matriculas');
  redirect('/matriculas?updated=1');
}
