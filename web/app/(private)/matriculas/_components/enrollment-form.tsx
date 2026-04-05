'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useTransition } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';

import type { ApiResponse } from '@/lib/api';
import type {
  ClassGroupAttributes,
  EnrollmentStatus,
  PersonAttributes,
} from '@/types/api';
import type { EnrollmentFormMode, EnrollmentFormValues } from '@/lib/validations/enrollment-form';
import { buildEnrollmentFormSchema } from '@/lib/validations/enrollment-form';

import { EnrollmentBillingPanel, type EnrollmentBillingPanelProps } from './enrollment-billing-panel';
import { saveEnrollmentAction, type SaveEnrollmentActionResult } from '../save-enrollment-action';

export type EnrollmentFormProps = {
  mode: EnrollmentFormMode;
  enrollmentId?: number;
  defaultValues: EnrollmentFormValues;
  initialStatusFromApi?: EnrollmentStatus;
  billing?: EnrollmentBillingPanelProps | null;
};

const inputClass =
  'mt-1.5 w-full min-h-11 rounded-control border border-border bg-card px-3.5 py-2.5 text-sm text-foreground shadow-input outline-none transition-[box-shadow,border-color] placeholder:text-placeholder focus:border-primary/55 focus:ring-2 focus:ring-primary/25';

const labelClass = 'text-sm font-medium text-secondary';

export function EnrollmentForm({
  mode,
  enrollmentId,
  defaultValues,
  initialStatusFromApi,
  billing,
}: EnrollmentFormProps) {
  const resolverSchema = useMemo(
    () => buildEnrollmentFormSchema(mode, initialStatusFromApi),
    [mode, initialStatusFromApi],
  );

  const form = useForm<EnrollmentFormValues>({
    resolver: zodResolver(resolverSchema) as Resolver<EnrollmentFormValues>,
    defaultValues,
  });

  const [pending, startTransition] = useTransition();

  const { data: studentsRes } = useQuery({
    queryKey: ['persons', 'students-options', 'enrollment-form'],
    queryFn: async () => {
      const p = new URLSearchParams();
      p.set('per_page', '500');
      p.set('filters[profile]', 'student');
      p.append('orderBy[full_name]', 'asc');
      const res = await fetch(`/api/persons?${p}`);
      if (!res.ok) throw new Error('Falha ao carregar alunos');
      return (await res.json()) as ApiResponse<PersonAttributes[]>;
    },
  });

  const { data: classGroupsRes } = useQuery({
    queryKey: ['class-groups', 'options', 'enrollment-form'],
    queryFn: async () => {
      const p = new URLSearchParams();
      p.set('per_page', '500');
      p.append('orderBy[name]', 'asc');
      const res = await fetch(`/api/class-groups?${p}`);
      if (!res.ok) throw new Error('Falha ao carregar turmas');
      return (await res.json()) as ApiResponse<ClassGroupAttributes[]>;
    },
  });

  const studentOptions = useMemo(
    () =>
      [...(studentsRes?.data ?? [])].sort((a, b) =>
        a.full_name.localeCompare(b.full_name, 'pt-BR'),
      ),
    [studentsRes?.data],
  );

  const classGroupOptions = useMemo(
    () =>
      [...(classGroupsRes?.data ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR'),
      ),
    [classGroupsRes?.data],
  );

  const watchedClassGroupId = form.watch('class_group_id');
  const isFirstClassGroupSync = useRef(true);

  useEffect(() => {
    if (mode !== 'create') {
      isFirstClassGroupSync.current = false;
      return;
    }
    if (isFirstClassGroupSync.current) {
      isFirstClassGroupSync.current = false;
      return;
    }
    const g = classGroupOptions.find((x) => x.id === watchedClassGroupId);
    if (!g || watchedClassGroupId <= 0) {
      form.setValue('plan_id', 0);
      return;
    }
    form.setValue('plan_id', 0);
    const starts = form.getValues('starts_on');
    if (starts) {
      form.setValue('billing_starts_on', starts);
    }
  }, [watchedClassGroupId, classGroupOptions, form, mode]);

  const planOptions = useMemo(() => {
    const g = classGroupOptions.find((x) => x.id === watchedClassGroupId);
    return [...(g?.plans ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [classGroupOptions, watchedClassGroupId]);

  const applyServerErrors = (result: Extract<SaveEnrollmentActionResult, { success: false }>) => {
    if (result.fieldErrors) {
      const keys: (keyof EnrollmentFormValues)[] = [
        'student_person_id',
        'class_group_id',
        'starts_on',
        'ends_on',
        'status',
        'plan_id',
        'billing_starts_on',
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
      const result = await saveEnrollmentAction({
        mode,
        enrollmentId,
        values,
        initialStatusFromApi,
      });
      if (!result.success) {
        applyServerErrors(result);
      }
    });
  });

  const title = mode === 'create' ? 'Nova matrícula' : 'Editar matrícula';
  const subtitle =
    mode === 'create'
      ? 'Vincule aluno e turma, escolha o plano de cobrança e a data da primeira cobrança.'
      : 'Atualize os dados da matrícula. Para trocar o plano, selecione outro e opcionalmente ajuste a data de referência da nova assinatura.';

  return (
    <div className="min-h-[calc(100dvh-8rem)] w-full min-w-0 px-4 py-6 sm:px-6 sm:py-10">
      <div className="w-full min-w-0">
        <header className="mb-6 sm:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Matrículas
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-prose text-pretty text-sm leading-relaxed text-secondary sm:max-w-none">
            {subtitle}
          </p>
        </header>

        <div className="flex w-full min-w-0 flex-col gap-6">
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
                <label htmlFor="enrollment-student" className={labelClass}>
                  Aluno
                </label>
                <Controller
                  name="student_person_id"
                  control={form.control}
                  render={({ field }) => (
                    <select
                      id="enrollment-student"
                      className={inputClass}
                      value={field.value ? String(field.value) : ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? 0 : Number(e.target.value))
                      }
                      aria-invalid={!!form.formState.errors.student_person_id}
                    >
                      <option value="">Selecione…</option>
                      {studentOptions.map((p) => (
                        <option key={p.id} value={String(p.id)}>
                          {p.full_name}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {form.formState.errors.student_person_id ? (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                    {form.formState.errors.student_person_id.message}
                  </p>
                ) : null}
              </div>

              <div className="min-w-0 lg:col-span-2">
                <label htmlFor="enrollment-class" className={labelClass}>
                  Turma
                </label>
                <Controller
                  name="class_group_id"
                  control={form.control}
                  render={({ field }) => (
                    <select
                      id="enrollment-class"
                      className={inputClass}
                      value={field.value ? String(field.value) : ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? 0 : Number(e.target.value))
                      }
                      aria-invalid={!!form.formState.errors.class_group_id}
                    >
                      <option value="">Selecione…</option>
                      {classGroupOptions.map((g) => (
                        <option key={g.id} value={String(g.id)}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {form.formState.errors.class_group_id ? (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                    {form.formState.errors.class_group_id.message}
                  </p>
                ) : null}
              </div>

              <div className="min-w-0 lg:col-span-2">
                <label htmlFor="enrollment-plan" className={labelClass}>
                  Plano de cobrança
                </label>
                <Controller
                  name="plan_id"
                  control={form.control}
                  render={({ field }) => (
                    <select
                      id="enrollment-plan"
                      className={inputClass}
                      value={field.value ? String(field.value) : '0'}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      disabled={watchedClassGroupId <= 0}
                      aria-invalid={!!form.formState.errors.plan_id}
                    >
                      <option value="0">
                        {mode === 'create' ? 'Selecione…' : 'Manter / não alterar'}
                      </option>
                      {planOptions.map((p) => (
                        <option key={p.id} value={String(p.id)}>
                          {p.name} · {p.billing_cycle === 'year' ? 'Ano' : 'Mês'} ×{' '}
                          {p.billing_interval}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {planOptions.length === 0 && watchedClassGroupId > 0 ? (
                  <p className="mt-2 text-sm text-muted">
                    Esta turma não tem planos vinculados.{' '}
                    <Link
                      href={`/class-groups/${watchedClassGroupId}/edit`}
                      className="font-medium text-primary underline-offset-2 hover:underline"
                    >
                      Editar turma
                    </Link>{' '}
                    ou{' '}
                    <Link href="/planos/new" className="font-medium text-primary underline-offset-2 hover:underline">
                      criar plano
                    </Link>
                    .
                  </p>
                ) : null}
                {form.formState.errors.plan_id ? (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                    {form.formState.errors.plan_id.message}
                  </p>
                ) : null}
              </div>

              <div className="min-w-0">
                <label htmlFor="enrollment-billing-starts" className={labelClass}>
                  Início da cobrança
                </label>
                <input
                  id="enrollment-billing-starts"
                  type="date"
                  className={inputClass}
                  aria-invalid={!!form.formState.errors.billing_starts_on}
                  {...form.register('billing_starts_on')}
                />
                <p className="mt-1.5 text-xs text-muted">
                  {mode === 'create'
                    ? 'Data de vencimento da primeira cobrança. A fatura costuma ser gerada alguns dias antes; se o vencimento for muito à frente, ela será criada automaticamente nessa antecedência.'
                    : 'Opcional ao editar. Preencha ao trocar o plano para definir a data de referência da nova assinatura.'}
                </p>
                {form.formState.errors.billing_starts_on ? (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                    {form.formState.errors.billing_starts_on.message}
                  </p>
                ) : null}
              </div>

              <div className="min-w-0">
                <label htmlFor="enrollment-starts" className={labelClass}>
                  Data de início da matrícula
                </label>
                <input
                  id="enrollment-starts"
                  type="date"
                  className={inputClass}
                  aria-invalid={!!form.formState.errors.starts_on}
                  {...form.register('starts_on')}
                />
                {form.formState.errors.starts_on ? (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                    {form.formState.errors.starts_on.message}
                  </p>
                ) : null}
              </div>

              <div className="min-w-0">
                <label htmlFor="enrollment-ends" className={labelClass}>
                  Data de término <span className="font-normal text-muted">(opcional)</span>
                </label>
                <Controller
                  name="ends_on"
                  control={form.control}
                  render={({ field }) => (
                    <input
                      id="enrollment-ends"
                      type="date"
                      className={inputClass}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? null : e.target.value)
                      }
                      aria-invalid={!!form.formState.errors.ends_on}
                    />
                  )}
                />
                {form.formState.errors.ends_on ? (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                    {form.formState.errors.ends_on.message}
                  </p>
                ) : null}
              </div>

              <div className="min-w-0 lg:col-span-2">
                <label htmlFor="enrollment-status" className={labelClass}>
                  Status
                </label>
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <select
                      id="enrollment-status"
                      className={inputClass}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={initialStatusFromApi === 'cancelled'}
                      aria-invalid={!!form.formState.errors.status}
                    >
                      <option value="active">Ativa</option>
                      <option value="locked">Trancada</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  )}
                />
                {initialStatusFromApi === 'cancelled' ? (
                  <p className="mt-1.5 text-xs text-muted">
                    Matrículas canceladas não podem ser reativadas.
                  </p>
                ) : null}
                {form.formState.errors.status ? (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                    {form.formState.errors.status.message}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end lg:col-span-2">
                <Link
                  href="/matriculas"
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

          {mode === 'edit' && billing ? (
            <EnrollmentBillingPanel
              subscriptionId={billing.subscriptionId}
              subscriptionStatus={billing.subscriptionStatus}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
