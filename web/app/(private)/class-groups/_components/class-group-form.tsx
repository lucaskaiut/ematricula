'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useTransition } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';

import type { ApiResponse } from '@/lib/api';
import type { ClassGroupFormMode, ClassGroupFormValues } from '@/lib/validations/class-group-form';
import { classGroupFormValuesSchema } from '@/lib/validations/class-group-form';
import type { ModalityAttributes, PersonAttributes, PlanAttributes } from '@/types/api';

import { saveClassGroupAction, type SaveClassGroupActionResult } from '../save-class-group-action';
import { WeekdayPicker } from '../weekday-picker';

export type ClassGroupFormProps = {
  mode: ClassGroupFormMode;
  classGroupId?: number;
  defaultValues: ClassGroupFormValues;
};

const inputClass =
  'mt-1.5 w-full min-h-11 rounded-control border border-border bg-card px-3.5 py-2.5 text-sm text-foreground shadow-input outline-none transition-[box-shadow,border-color] placeholder:text-placeholder focus:border-primary/55 focus:ring-2 focus:ring-primary/25';

const labelClass = 'text-sm font-medium text-secondary';

const schema = classGroupFormValuesSchema;

export function ClassGroupForm({ mode, classGroupId, defaultValues }: ClassGroupFormProps) {
  const form = useForm<ClassGroupFormValues>({
    resolver: zodResolver(schema) as Resolver<ClassGroupFormValues>,
    defaultValues,
  });

  const [pending, startTransition] = useTransition();

  const { data: modalitiesRes } = useQuery({
    queryKey: ['modalities', 'options', 'class-groups-form'],
    queryFn: async () => {
      const p = new URLSearchParams();
      p.set('per_page', '500');
      p.append('orderBy[name]', 'asc');
      const res = await fetch(`/api/modalities?${p}`);
      if (!res.ok) throw new Error('Falha ao carregar modalidades');
      return (await res.json()) as ApiResponse<ModalityAttributes[]>;
    },
  });

  const { data: plansRes } = useQuery({
    queryKey: ['plans', 'options', 'class-groups-form'],
    queryFn: async () => {
      const p = new URLSearchParams();
      p.set('per_page', '500');
      p.append('orderBy[name]', 'asc');
      const res = await fetch(`/api/plans?${p}`);
      if (!res.ok) throw new Error('Falha ao carregar planos');
      return (await res.json()) as ApiResponse<PlanAttributes[]>;
    },
  });

  const { data: teachersRes } = useQuery({
    queryKey: ['persons', 'teachers-options', 'class-groups-form'],
    queryFn: async () => {
      const p = new URLSearchParams();
      p.set('per_page', '500');
      p.set('filters[profile]', 'teacher');
      p.append('orderBy[full_name]', 'asc');
      const res = await fetch(`/api/persons?${p}`);
      if (!res.ok) throw new Error('Falha ao carregar professores');
      return (await res.json()) as ApiResponse<PersonAttributes[]>;
    },
  });

  const modalityOptions = modalitiesRes?.data ?? [];
  const teacherOptions = teachersRes?.data ?? [];

  const modalitySelectOptions = useMemo(
    () => [...modalityOptions].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [modalityOptions],
  );

  const teacherSelectOptions = useMemo(
    () => [...teacherOptions].sort((a, b) => a.full_name.localeCompare(b.full_name, 'pt-BR')),
    [teacherOptions],
  );

  const planOptions = useMemo(
    () => [...(plansRes?.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [plansRes?.data],
  );

  const applyServerErrors = (result: Extract<SaveClassGroupActionResult, { success: false }>) => {
    if (result.fieldErrors) {
      const fieldKeys: (keyof ClassGroupFormValues)[] = [
        'name',
        'modality_id',
        'teacher_person_id',
        'max_capacity',
        'weekdays',
        'starts_at',
        'ends_at',
        'plan_ids',
      ];
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
      const result = await saveClassGroupAction({
        mode,
        classGroupId,
        values,
      });
      if (!result.success) {
        applyServerErrors(result);
      }
    });
  });

  const title = mode === 'create' ? 'Nova turma' : 'Editar turma';
  const subtitle =
    mode === 'create'
      ? 'Defina nome, modalidade, professor, dias e horários da turma.'
      : 'Atualize os dados da turma. Planos definem as opções de cobrança na matrícula.';

  return (
    <div className="min-h-[calc(100dvh-8rem)] w-full min-w-0 px-4 py-6 sm:px-6 sm:py-10">
      <div className="w-full min-w-0">
        <header className="mb-6 sm:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Turmas</p>
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
              <label htmlFor="class-group-name" className={labelClass}>
                Nome
              </label>
              <input
                id="class-group-name"
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
              <label htmlFor="class-group-modality" className={labelClass}>
                Modalidade
              </label>
              <select
                id="class-group-modality"
                className={inputClass}
                aria-invalid={!!form.formState.errors.modality_id}
                {...form.register('modality_id', { valueAsNumber: true })}
              >
                <option value={0}>Selecione…</option>
                {modalitySelectOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.modality_id ? (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                  {form.formState.errors.modality_id.message}
                </p>
              ) : null}
            </div>

            <div className="min-w-0">
              <label htmlFor="class-group-teacher" className={labelClass}>
                Professor
              </label>
              <select
                id="class-group-teacher"
                className={inputClass}
                aria-invalid={!!form.formState.errors.teacher_person_id}
                {...form.register('teacher_person_id', { valueAsNumber: true })}
              >
                <option value={0}>Selecione…</option>
                {teacherSelectOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
              {form.formState.errors.teacher_person_id ? (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                  {form.formState.errors.teacher_person_id.message}
                </p>
              ) : null}
            </div>

            <div className="min-w-0">
              <label htmlFor="class-group-capacity" className={labelClass}>
                Capacidade máxima <span className="font-normal text-muted">(opcional)</span>
              </label>
              <input
                id="class-group-capacity"
                type="number"
                min={1}
                step={1}
                className={inputClass}
                aria-invalid={!!form.formState.errors.max_capacity}
                {...form.register('max_capacity', {
                  setValueAs: (v) => {
                    if (v === '' || v === undefined || v === null) return null;
                    const n = Number(v);
                    return Number.isFinite(n) ? n : null;
                  },
                })}
              />
              {form.formState.errors.max_capacity ? (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                  {form.formState.errors.max_capacity.message}
                </p>
              ) : null}
            </div>

            <div className="min-w-0 lg:col-span-2">
              <p className={labelClass}>Planos aceitos na matrícula</p>
              <p className="mt-1 text-xs text-muted">
                Selecione quais planos o aluno poderá escolher ao se matricular nesta turma.
              </p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {planOptions.map((plan) => (
                  <li key={plan.id}>
                    <label className="flex cursor-pointer items-start gap-2.5 rounded-control border border-border bg-card px-3 py-2.5 text-sm shadow-input has-focus-visible:ring-2 has-focus-visible:ring-primary/25">
                      <Controller
                        name="plan_ids"
                        control={form.control}
                        render={({ field }) => {
                          const checked = field.value.includes(plan.id);
                          return (
                            <input
                              type="checkbox"
                              className="mt-0.5 size-4 shrink-0 rounded border-border"
                              checked={checked}
                              onChange={(e) => {
                                const next = new Set(field.value);
                                if (e.target.checked) next.add(plan.id);
                                else next.delete(plan.id);
                                field.onChange([...next].sort((a, b) => a - b));
                              }}
                            />
                          );
                        }}
                      />
                      <span className="min-w-0">
                        <span className="font-medium text-foreground">{plan.name}</span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {plan.billing_cycle === 'year' ? 'Ano' : 'Mês'} · intervalo{' '}
                          {plan.billing_interval}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              {planOptions.length === 0 ? (
                <p className="mt-2 text-sm text-muted">
                  Nenhum plano cadastrado.{' '}
                  <Link href="/planos/new" className="font-medium text-primary underline-offset-2 hover:underline">
                    Criar plano
                  </Link>
                </p>
              ) : null}
              {form.formState.errors.plan_ids ? (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
                  {form.formState.errors.plan_ids.message as string}
                </p>
              ) : null}
            </div>

            <div className="min-w-0 lg:col-span-2">
              <Controller
                control={form.control}
                name="weekdays"
                render={({ field }) => (
                  <WeekdayPicker
                    value={field.value}
                    onChange={field.onChange}
                    disabled={pending}
                  />
                )}
              />
              {form.formState.errors.weekdays ? (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                  {form.formState.errors.weekdays.message}
                </p>
              ) : null}
            </div>

            <div className="min-w-0">
              <label htmlFor="class-group-starts" className={labelClass}>
                Horário de início
              </label>
              <input
                id="class-group-starts"
                type="time"
                className={inputClass}
                aria-invalid={!!form.formState.errors.starts_at}
                {...form.register('starts_at')}
              />
              {form.formState.errors.starts_at ? (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                  {form.formState.errors.starts_at.message}
                </p>
              ) : null}
            </div>

            <div className="min-w-0">
              <label htmlFor="class-group-ends" className={labelClass}>
                Horário de fim
              </label>
              <input
                id="class-group-ends"
                type="time"
                className={inputClass}
                aria-invalid={!!form.formState.errors.ends_at}
                {...form.register('ends_at')}
              />
              {form.formState.errors.ends_at ? (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                  {form.formState.errors.ends_at.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end lg:col-span-2">
              <Link
                href="/class-groups"
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
