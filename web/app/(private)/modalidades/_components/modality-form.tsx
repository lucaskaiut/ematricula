'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useTransition } from 'react';
import { useForm, type Resolver } from 'react-hook-form';

import type { ModalityFormMode, ModalityFormValues } from '@/lib/validations/modality-form';
import { modalityFormValuesSchema } from '@/lib/validations/modality-form';

import { saveModalityAction, type SaveModalityActionResult } from '../save-modality-action';

export type ModalityFormProps = {
  mode: ModalityFormMode;
  modalityId?: number;
  defaultValues: Pick<ModalityFormValues, 'name' | 'description'>;
};

const inputClass =
  'mt-1.5 w-full min-h-11 rounded-[var(--ematricula-radius-control)] border border-[var(--ematricula-border-input)] bg-white px-3.5 py-2.5 text-sm text-ematricula-text-primary shadow-[var(--shadow-ematricula-input)] outline-none transition-[box-shadow,border-color] placeholder:text-ematricula-text-placeholder focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/25';

const labelClass = 'text-sm font-medium text-ematricula-text-secondary';

const schema = modalityFormValuesSchema;

export function ModalityForm({ mode, modalityId, defaultValues }: ModalityFormProps) {
  const form = useForm<ModalityFormValues>({
    resolver: zodResolver(schema) as Resolver<ModalityFormValues>,
    defaultValues: {
      name: defaultValues.name,
      description: defaultValues.description,
    },
  });

  const [pending, startTransition] = useTransition();

  const applyServerErrors = (result: Extract<SaveModalityActionResult, { success: false }>) => {
    if (result.fieldErrors) {
      const fieldKeys: (keyof ModalityFormValues)[] = ['name', 'description'];
      for (const key of fieldKeys) {
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
      const result = await saveModalityAction({
        mode,
        modalityId,
        values,
      });
      if (!result.success) {
        applyServerErrors(result);
      }
    });
  });

  const title = mode === 'create' ? 'Nova modalidade' : 'Editar modalidade';
  const subtitle =
    mode === 'create'
      ? 'Defina o nome e, se quiser, uma descrição para a modalidade.'
      : 'Atualize os dados da modalidade.';

  return (
    <div className="min-h-[calc(100dvh-8rem)] w-full min-w-0 px-4 py-6 sm:px-6 sm:py-10">
      <div className="w-full min-w-0">
        <header className="mb-6 sm:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ematricula-text-muted">
            Modalidades
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-ematricula-text-primary sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-prose text-pretty text-sm leading-relaxed text-ematricula-text-secondary sm:max-w-none">
            {subtitle}
          </p>
        </header>

        <div className="w-full min-w-0 rounded-[var(--ematricula-radius-card)] border border-slate-200/80 bg-ematricula-surface p-5 shadow-[var(--shadow-ematricula-card)] sm:p-8">
          <form
            onSubmit={onSubmit}
            className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-x-8 lg:gap-y-6"
            noValidate
          >
            {form.formState.errors.root?.message ? (
              <div
                role="alert"
                className="rounded-[var(--ematricula-radius-control)] border border-red-200 bg-red-50/90 px-3.5 py-3 text-sm text-red-800 lg:col-span-2"
              >
                {form.formState.errors.root.message}
              </div>
            ) : null}

            <div className="min-w-0 lg:col-span-2">
              <label htmlFor="modality-name" className={labelClass}>
                Nome
              </label>
              <input
                id="modality-name"
                type="text"
                autoComplete="off"
                className={inputClass}
                aria-invalid={!!form.formState.errors.name}
                {...form.register('name')}
              />
              {form.formState.errors.name ? (
                <p className="mt-1.5 text-sm text-red-600" role="alert">
                  {form.formState.errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="min-w-0 lg:col-span-2">
              <label htmlFor="modality-description" className={labelClass}>
                Descrição <span className="font-normal text-ematricula-text-muted">(opcional)</span>
              </label>
              <textarea
                id="modality-description"
                rows={5}
                className={inputClass}
                {...form.register('description')}
              />
              {form.formState.errors.description ? (
                <p className="mt-1.5 text-sm text-red-600" role="alert">
                  {form.formState.errors.description.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end lg:col-span-2">
              <Link
                href="/modalidades"
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--ematricula-radius-control)] px-4 text-sm font-medium text-ematricula-text-secondary ring-1 ring-slate-200/90 transition-colors hover:bg-slate-50"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--ematricula-radius-control)] bg-gradient-to-br from-[var(--ematricula-cta-gradient-from)] to-[var(--ematricula-cta-gradient-to)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-ematricula-cta)] transition-[transform,opacity] hover:opacity-95 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
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
