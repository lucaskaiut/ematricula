'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';

import type { UserFormMode, UserFormValues } from '@/lib/validations/user-form';
import { userFormSchemaCreate, userFormSchemaEdit } from '@/lib/validations/user-form';

import { saveUserAction, type SaveUserActionResult } from '../save-user-action';

export type UserFormProps = {
  mode: UserFormMode;
  userId?: number;
  defaultValues: Pick<UserFormValues, 'name' | 'email'> & { password?: string };
};

const inputClass =
  'mt-1.5 w-full min-h-11 rounded-[var(--ematricula-radius-control)] border border-[var(--ematricula-border-input)] bg-white px-3.5 py-2.5 text-sm text-ematricula-text-primary shadow-[var(--shadow-ematricula-input)] outline-none transition-[box-shadow,border-color] placeholder:text-ematricula-text-placeholder focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/25';

const labelClass = 'text-sm font-medium text-ematricula-text-secondary';

export function UserForm({ mode, userId, defaultValues }: UserFormProps) {
  const schema = mode === 'create' ? userFormSchemaCreate() : userFormSchemaEdit();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues.name,
      email: defaultValues.email,
      password: defaultValues.password ?? '',
    },
  });

  const [pending, startTransition] = useTransition();

  const applyServerErrors = (result: Extract<SaveUserActionResult, { success: false }>) => {
    if (result.fieldErrors) {
      for (const key of ['name', 'email', 'password'] as const) {
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
      const result = await saveUserAction({
        mode,
        userId,
        values,
      });
      if (!result.success) {
        applyServerErrors(result);
      }
    });
  });

  const title = mode === 'create' ? 'Novo usuário' : 'Editar usuário';
  const subtitle =
    mode === 'create'
      ? 'Preencha os dados para cadastrar um novo acesso.'
      : 'Atualize os dados. Deixe a senha em branco para mantê-la.';

  return (
    <div className="min-h-[calc(100dvh-8rem)] w-full min-w-0 px-4 py-6 sm:px-6 sm:py-10">
      <div className="w-full min-w-0">
        <header className="mb-6 sm:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ematricula-text-muted">
            Usuários
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

            <div className="min-w-0">
              <label htmlFor="user-name" className={labelClass}>
                Nome
              </label>
              <input
                id="user-name"
                type="text"
                autoComplete="name"
                className={inputClass}
                aria-invalid={!!form.formState.errors.name}
                aria-describedby={form.formState.errors.name ? 'user-name-error' : undefined}
                {...form.register('name')}
              />
              {form.formState.errors.name ? (
                <p id="user-name-error" className="mt-1.5 text-sm text-red-600" role="alert">
                  {form.formState.errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="min-w-0">
              <label htmlFor="user-email" className={labelClass}>
                E-mail
              </label>
              <input
                id="user-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                className={inputClass}
                aria-invalid={!!form.formState.errors.email}
                aria-describedby={form.formState.errors.email ? 'user-email-error' : undefined}
                {...form.register('email')}
              />
              {form.formState.errors.email ? (
                <p id="user-email-error" className="mt-1.5 text-sm text-red-600" role="alert">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="min-w-0 lg:col-span-2">
              <label htmlFor="user-password" className={labelClass}>
                Senha
                {mode === 'edit' ? (
                  <span className="ml-1 font-normal text-ematricula-text-muted">
                    (opcional)
                  </span>
                ) : null}
              </label>
              <input
                id="user-password"
                type="password"
                autoComplete={mode === 'create' ? 'new-password' : 'new-password'}
                className={inputClass}
                aria-invalid={!!form.formState.errors.password}
                aria-describedby={
                  form.formState.errors.password ? 'user-password-error' : 'user-password-hint'
                }
                {...form.register('password')}
              />
              <p id="user-password-hint" className="mt-1.5 text-xs text-ematricula-text-muted">
                {mode === 'create'
                  ? 'Mínimo de 8 caracteres.'
                  : 'Deixe em branco para não alterar a senha atual.'}
              </p>
              {form.formState.errors.password ? (
                <p id="user-password-error" className="mt-1.5 text-sm text-red-600" role="alert">
                  {form.formState.errors.password.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end lg:col-span-2">
              <Link
                href="/users"
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
