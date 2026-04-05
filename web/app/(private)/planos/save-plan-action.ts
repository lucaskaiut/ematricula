'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ZodIssue } from 'zod';

import { Api } from '@/lib/api';
import type { PlanFormMode, PlanFormValues } from '@/lib/validations/plan-form';
import { parsePlanFormForServer } from '@/lib/validations/plan-form';
import { ApiError } from '@/services/api-client';

export type SavePlanActionResult =
  | { success: true }
  | {
      success: false;
      message: string;
      fieldErrors?: Partial<Record<keyof PlanFormValues, string>>;
    };

const keys: (keyof PlanFormValues)[] = ['name', 'price', 'billing_cycle', 'billing_interval'];

function flattenZodFieldErrors(issues: ZodIssue[]): Partial<Record<keyof PlanFormValues, string>> {
  const out: Partial<Record<keyof PlanFormValues, string>> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (keys.includes(key as keyof PlanFormValues)) {
      const k = key as keyof PlanFormValues;
      if (!out[k]) out[k] = issue.message;
    }
  }
  return out;
}

function mapApiValidationToFields(
  errors: Record<string, string[]> | undefined,
): Partial<Record<keyof PlanFormValues, string>> {
  if (!errors) return {};
  const map: Record<string, keyof PlanFormValues> = {
    name: 'name',
    price: 'price',
    billing_cycle: 'billing_cycle',
    billing_interval: 'billing_interval',
  };
  const out: Partial<Record<keyof PlanFormValues, string>> = {};
  for (const [apiKey, messages] of Object.entries(errors)) {
    const formKey = map[apiKey];
    if (formKey && messages?.[0]) out[formKey] = messages[0];
  }
  return out;
}

export async function savePlanAction(input: {
  mode: PlanFormMode;
  planId?: number;
  values: PlanFormValues;
}): Promise<SavePlanActionResult> {
  const parsed = parsePlanFormForServer(input.values);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Verifique os campos destacados.',
      fieldErrors: flattenZodFieldErrors(parsed.error.issues),
    };
  }

  const d = parsed.data;
  const body = {
    name: d.name.trim(),
    price: d.price,
    billing_cycle: d.billing_cycle,
    billing_interval: d.billing_interval,
  };

  try {
    if (input.mode === 'create') {
      const api = new Api('/plans');
      await api.post(body);
    } else {
      if (input.planId === undefined) {
        return { success: false, message: 'Identificador ausente.' };
      }
      const api = new Api(`/plans/${input.planId}`);
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

  revalidatePath('/planos');
  redirect('/planos?updated=1');
}
