'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useTransition } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';

import { BrlPriceField } from '@/components/BrlPriceField';
import type { PlanFormMode, PlanFormValues } from '@/lib/validations/plan-form';
import { planFormValuesSchema } from '@/lib/validations/plan-form';

import { savePlanAction, type SavePlanActionResult } from '../save-plan-action';

export type PlanFormProps = {
  mode: PlanFormMode;
  planId?: number;
  defaultValues: PlanFormValues;
};

const inputClass =
  'mt-1.5 w-full min-h-11 rounded-control border border-border bg-card px-3.5 py-2.5 text-sm text-foreground shadow-input outline-none transition-[box-shadow,border-color] placeholder:text-placeholder focus:border-primary/55 focus:ring-2 focus:ring-primary/25';

const labelClass = 'text-sm font-medium text-secondary';

const schema = planFormValuesSchema;

export function PlanForm({ mode, planId, defaultValues }: PlanFormProps) {
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(schema) as Resolver<PlanFormValues>,
    defaultValues,
  });

  const [pending, startTransition] = useTransition();

  const applyServerErrors = (result: Extract<SavePlanActionResult, { success: false }>) => {
    if (result.fieldErrors) {
      for (const key of ['name', 'price', 'billing_cycle', 'billing_interval'] as const) {
        const msg = result.fieldErrors[key];
        if (msg) form.setError(key, { message: msg });
      }
    }
    if (
      result.message &&
      (!result.fieldErrors || Object.keys(result.fieldErrors).length === 0)
    ) {
      form.setError('root', { type: 'server', message: result.message });
    }
  };

  const onSubmit = form.handleSubmit((values) => {
    form.clearErrors('root');
    startTransition(async () => {
      const result = await savePlanAction({
        mode,
        planId,
        values,
      });
      if (!result.success) {
        applyServerErrors(result);
      }
    });
  });

  const title = mode === 'create' ? 'Novo plano' : 'Editar plano';
  const subtitle =
    mode === 'create'
      ? 'Defina nome, valor e periodicidade de cobrança.'
      : 'Atualize os dados do plano.';

  return (
    <div className="min-h-[calc(100dvh-8rem)] w-full min-w-0 px-4 py-6 sm:px-6 sm:py-10">
      <div className="w-full min-w-0">
        <header className="mb-6 sm:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Planos</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-prose text-pretty text-sm leading-relaxed text-secondary sm:max-w-none">
            {subtitle}
          </p>
        </header>

        <div className="w-full min-w-0 rounded-card border border-border bg-card p-5 shadow-card sm:p-8">
          <form
            onSubmit={onSubmit}
            className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-x-8 lg:gap-y-6"
            noValidate
          >
            {form.formState.errors.root?.message ? (
              <div
                role="alert"
                className="rounded-control border border-red-200 bg-red-50/90 px-3.5 py-3 text-sm text-red-800 dark:border-red-900/70 dark:bg-red-950/45 dark:text-red-200 lg:col-span-2"
              >
                {form.formState.errors.root.message}
              </div>
            ) : null}

            <div className="min-w-0 lg:col-span-2">
              <label htmlFor="plan-name" className={labelClass}>
                Nome
              </label>
              <input
                id="plan-name"
                type="text"
                autoComplete="off"
                className={inputClass}
                aria-invalid={!!form.formState.errors.name}
                {...form.register('name')}
              />
              {form.formState.errors.name ? (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                  {form.formState.errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="min-w-0">
              <Controller
                name="price"
                control={form.control}
                render={({ field }) => (
                  <BrlPriceField
                    id="plan-price"
                    label="Valor"
                    value={field.value}
                    onChange={field.onChange}
                    disabled={pending}
                    error={form.formState.errors.price?.message}
                    aria-invalid={!!form.formState.errors.price}
                  />
                )}
              />
            </div>

            <div className="min-w-0">
              <label htmlFor="plan-cycle" className={labelClass}>
                Ciclo
              </label>
              <select
                id="plan-cycle"
                className={inputClass}
                aria-invalid={!!form.formState.errors.billing_cycle}
                {...form.register('billing_cycle')}
              >
                <option value="month">Mês</option>
                <option value="year">Ano</option>
              </select>
              {form.formState.errors.billing_cycle ? (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                  {form.formState.errors.billing_cycle.message}
                </p>
              ) : null}
            </div>

            <div className="min-w-0 lg:col-span-2">
              <label htmlFor="plan-interval" className={labelClass}>
                Intervalo
              </label>
              <input
                id="plan-interval"
                type="number"
                min={1}
                step={1}
                className={inputClass}
                aria-invalid={!!form.formState.errors.billing_interval}
                {...form.register('billing_interval', { valueAsNumber: true })}
              />
              <p className="mt-1.5 text-xs text-muted">
                Quantidade de ciclos entre cobranças (ex.: 1 mensal, 3 trimestral em meses).
              </p>
              {form.formState.errors.billing_interval ? (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                  {form.formState.errors.billing_interval.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end lg:col-span-2">
              <Link
                href="/planos"
                className="inline-flex min-h-11 items-center justify-center rounded-control px-4 text-sm font-medium text-secondary ring-1 ring-border transition-colors hover:bg-accent"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex min-h-11 items-center justify-center rounded-control bg-linear-to-br from-primary to-primary-end px-5 text-sm font-semibold text-primary-foreground shadow-cta transition-[transform,opacity] hover:opacity-95 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
              >
                {pending ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
