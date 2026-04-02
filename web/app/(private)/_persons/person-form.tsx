'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTransition } from 'react';
import { Controller, useForm, useWatch, type Resolver } from 'react-hook-form';

import { maskBrazilianCpf, maskBrazilianPhone } from '@/lib/masks/br-cpf-phone';
import { personIsMinorFromIsoDate } from '@/lib/person-age';
import type { PersonFormMode, PersonFormValues } from '@/lib/validations/person-form';
import { personFormValuesSchema } from '@/lib/validations/person-form';
import type { PersonAttributes, PersonProfile } from '@/types/api';

import { listGuardianOptions } from './actions';
import { savePersonAction, type SavePersonActionResult } from './save-person-action';

export type PersonFormProps = {
  mode: PersonFormMode;
  profile: PersonProfile;
  listPath: string;
  labels: { segment: string; newTitle: string; editTitle: string; subtitleCreate: string; subtitleEdit: string };
  personId?: number;
  defaultValues: {
    full_name: string;
    birth_date: string;
    cpf: string;
    phone: string;
    email: string;
    guardian_person_id: string;
    status: 'active' | 'inactive';
    notes: string;
  };
};

const inputClass =
  'mt-1.5 w-full min-h-11 rounded-[var(--ematricula-radius-control)] border border-[var(--ematricula-border-input)] bg-white px-3.5 py-2.5 text-sm text-ematricula-text-primary shadow-[var(--shadow-ematricula-input)] outline-none transition-[box-shadow,border-color] placeholder:text-ematricula-text-placeholder focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/25';

const labelClass = 'text-sm font-medium text-ematricula-text-secondary';

export function PersonForm({
  mode,
  profile,
  listPath,
  labels,
  personId,
  defaultValues,
}: PersonFormProps) {
  const schema = useMemo(() => personFormValuesSchema(profile), [profile]);

  const maskedDefaults = useMemo(
    () => ({
      ...defaultValues,
      cpf: maskBrazilianCpf(defaultValues.cpf ?? ''),
      phone: maskBrazilianPhone(defaultValues.phone ?? ''),
    }),
    [
      defaultValues.birth_date,
      defaultValues.cpf,
      defaultValues.email,
      defaultValues.full_name,
      defaultValues.guardian_person_id,
      defaultValues.notes,
      defaultValues.phone,
      defaultValues.status,
    ],
  );

  const form = useForm<PersonFormValues>({
    resolver: zodResolver(schema) as Resolver<PersonFormValues>,
    defaultValues: maskedDefaults,
  });

  const birthDate = useWatch({ control: form.control, name: 'birth_date' });
  const showGuardian =
    profile === 'student' && birthDate && personIsMinorFromIsoDate(birthDate);

  const { data: guardiansRes } = useQuery({
    queryKey: ['persons', 'guardian-options'],
    queryFn: () => listGuardianOptions(),
    enabled: showGuardian === true,
  });

  const guardianOptions = useMemo(() => {
    const rows = guardiansRes?.data ?? [];
    return rows.filter((p: PersonAttributes) => {
      if (personId !== undefined && p.id === personId) return false;
      return true;
    });
  }, [guardiansRes?.data, personId]);

  const [pending, startTransition] = useTransition();

  const applyServerErrors = (result: Extract<SavePersonActionResult, { success: false }>) => {
    if (result.fieldErrors) {
      const keys: (keyof PersonFormValues)[] = [
        'full_name',
        'birth_date',
        'cpf',
        'phone',
        'email',
        'guardian_person_id',
        'status',
        'notes',
      ];
      for (const key of keys) {
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
      const result = await savePersonAction({
        mode,
        profile,
        listPath,
        personId,
        values,
      });
      if (!result.success) {
        applyServerErrors(result);
      }
    });
  });

  const title = mode === 'create' ? labels.newTitle : labels.editTitle;
  const subtitle = mode === 'create' ? labels.subtitleCreate : labels.subtitleEdit;

  return (
    <div className="min-h-[calc(100dvh-8rem)] w-full min-w-0 px-4 py-6 sm:px-6 sm:py-10">
      <div className="w-full min-w-0">
        <header className="mb-6 sm:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ematricula-text-muted">
            {labels.segment}
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
              <label htmlFor="person-full-name" className={labelClass}>
                Nome completo
              </label>
              <input
                id="person-full-name"
                type="text"
                autoComplete="name"
                className={inputClass}
                aria-invalid={!!form.formState.errors.full_name}
                aria-describedby={
                  form.formState.errors.full_name ? 'person-full-name-error' : undefined
                }
                {...form.register('full_name')}
              />
              {form.formState.errors.full_name ? (
                <p id="person-full-name-error" className="mt-1.5 text-sm text-red-600" role="alert">
                  {form.formState.errors.full_name.message}
                </p>
              ) : null}
            </div>

            <div className="min-w-0">
              <label htmlFor="person-birth-date" className={labelClass}>
                Data de nascimento
              </label>
              <input
                id="person-birth-date"
                type="date"
                className={inputClass}
                aria-invalid={!!form.formState.errors.birth_date}
                {...form.register('birth_date')}
              />
              {form.formState.errors.birth_date ? (
                <p className="mt-1.5 text-sm text-red-600" role="alert">
                  {form.formState.errors.birth_date.message}
                </p>
              ) : null}
            </div>

            <div className="min-w-0">
              <label htmlFor="person-cpf" className={labelClass}>
                CPF <span className="font-normal text-ematricula-text-muted">(opcional)</span>
              </label>
              <Controller
                name="cpf"
                control={form.control}
                render={({ field }) => (
                  <input
                    id="person-cpf"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="000.000.000-00"
                    className={inputClass}
                    aria-invalid={!!form.formState.errors.cpf}
                    value={field.value}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    onChange={(e) => field.onChange(maskBrazilianCpf(e.target.value))}
                  />
                )}
              />
              {form.formState.errors.cpf ? (
                <p className="mt-1.5 text-sm text-red-600" role="alert">
                  {form.formState.errors.cpf.message}
                </p>
              ) : null}
            </div>

            <div className="min-w-0">
              <label htmlFor="person-phone" className={labelClass}>
                Telefone
              </label>
              <Controller
                name="phone"
                control={form.control}
                render={({ field }) => (
                  <input
                    id="person-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="(11) 98765-4321"
                    className={inputClass}
                    aria-invalid={!!form.formState.errors.phone}
                    value={field.value}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    onChange={(e) => field.onChange(maskBrazilianPhone(e.target.value))}
                  />
                )}
              />
              {form.formState.errors.phone ? (
                <p className="mt-1.5 text-sm text-red-600" role="alert">
                  {form.formState.errors.phone.message}
                </p>
              ) : null}
            </div>

            <div className="min-w-0">
              <label htmlFor="person-email" className={labelClass}>
                E-mail
              </label>
              <input
                id="person-email"
                type="email"
                autoComplete="email"
                className={inputClass}
                {...form.register('email')}
              />
              {form.formState.errors.email ? (
                <p className="mt-1.5 text-sm text-red-600" role="alert">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>

            {showGuardian ? (
              <div className="min-w-0 lg:col-span-2">
                <label htmlFor="person-guardian" className={labelClass}>
                  Responsável (menor de idade)
                </label>
                <select
                  id="person-guardian"
                  className={inputClass}
                  aria-invalid={!!form.formState.errors.guardian_person_id}
                  {...form.register('guardian_person_id')}
                >
                  <option value="">Selecione…</option>
                  {guardianOptions.map((p: PersonAttributes) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.full_name} — {p.profile === 'teacher' ? 'Professor' : 'Aluno'}
                    </option>
                  ))}
                </select>
                {form.formState.errors.guardian_person_id ? (
                  <p className="mt-1.5 text-sm text-red-600" role="alert">
                    {form.formState.errors.guardian_person_id.message}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="min-w-0">
              <label htmlFor="person-status" className={labelClass}>
                Status
              </label>
              <select
                id="person-status"
                className={inputClass}
                {...form.register('status')}
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
              {form.formState.errors.status ? (
                <p className="mt-1.5 text-sm text-red-600" role="alert">
                  {form.formState.errors.status.message}
                </p>
              ) : null}
            </div>

            <div className="min-w-0 lg:col-span-2">
              <label htmlFor="person-notes" className={labelClass}>
                Observações
              </label>
              <textarea
                id="person-notes"
                rows={4}
                className={inputClass}
                {...form.register('notes')}
              />
              {form.formState.errors.notes ? (
                <p className="mt-1.5 text-sm text-red-600" role="alert">
                  {form.formState.errors.notes.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end lg:col-span-2">
              <Link
                href={listPath}
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
