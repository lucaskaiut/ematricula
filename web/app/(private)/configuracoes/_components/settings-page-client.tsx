'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ApiResponse } from '@/lib/api';
import type { TenantSettingField, TenantSettingsGrouped } from '@/types/api';
import { SettingField } from './setting-field';

const GROUP_LABELS: Record<string, string> = {
  general: 'Geral',
  invoice: 'Faturas',
  notifications: 'Notificações',
  integrations: 'Integrações',
};

function groupTitle(slug: string): string {
  return GROUP_LABELS[slug] ?? slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function flattenFields(grouped: TenantSettingsGrouped): TenantSettingField[] {
  return Object.values(grouped).flat();
}

function valueForForm(field: TenantSettingField): unknown {
  if (field.type === 'json') {
    if (field.value === null || field.value === undefined) return '{}';
    if (typeof field.value === 'string') return field.value;
    return JSON.stringify(field.value, null, 2);
  }
  return field.value;
}

function defaultForForm(field: TenantSettingField): unknown {
  if (field.type === 'json') {
    if (field.default_value === null || field.default_value === undefined) return '{}';
    if (typeof field.default_value === 'string') return field.default_value;
    return JSON.stringify(field.default_value, null, 2);
  }
  return field.default_value;
}

function validateValues(
  fields: TenantSettingField[],
  values: Record<string, unknown>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const v = values[field.key];
    if (field.type === 'number') {
      if (v === '' || v === null || v === undefined) {
        continue;
      }
      const n = typeof v === 'number' ? v : Number(v);
      if (!Number.isFinite(n)) {
        errors[field.key] = 'Informe um número válido.';
      }
    }
    if (field.type === 'json' && typeof v === 'string') {
      const t = v.trim();
      if (t === '') continue;
      try {
        JSON.parse(t);
      } catch {
        errors[field.key] = 'JSON inválido.';
      }
    }
  }
  return errors;
}

function buildPayload(fields: TenantSettingField[], values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    const v = values[field.key];
    if (field.type === 'number') {
      if (v === '' || v === null || v === undefined) {
        out[field.key] = null;
        continue;
      }
      const n = typeof v === 'number' ? v : Number(v);
      out[field.key] = Number.isFinite(n) ? n : v;
      continue;
    }
    if (field.type === 'json' && typeof v === 'string') {
      const t = v.trim();
      out[field.key] = t === '' ? {} : JSON.parse(t);
      continue;
    }
    out[field.key] = v;
  }
  return out;
}

export const tenantSettingsQueryKey = ['tenant-settings'] as const;

async function fetchSettings(): Promise<ApiResponse<TenantSettingsGrouped>> {
  const res = await fetch('/api/settings');
  if (!res.ok) throw new Error('Falha ao carregar configurações');
  return (await res.json()) as ApiResponse<TenantSettingsGrouped>;
}

async function saveSettings(body: Record<string, unknown>): Promise<ApiResponse<TenantSettingsGrouped>> {
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = (await res.json()) as { message?: string; data?: TenantSettingsGrouped };
  if (!res.ok) {
    throw new Error(typeof payload.message === 'string' ? payload.message : 'Falha ao salvar');
  }
  if (!payload.data) {
    throw new Error('Resposta inválida da API.');
  }
  return { data: payload.data };
}

export function SettingsPageClient() {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [search, setSearch] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: tenantSettingsQueryKey,
    queryFn: fetchSettings,
  });

  const grouped = data?.data;

  const fields = useMemo(() => (grouped ? flattenFields(grouped) : []), [grouped]);

  useEffect(() => {
    if (!grouped) return;
    const next: Record<string, unknown> = {};
    for (const f of flattenFields(grouped)) {
      next[f.key] = valueForForm(f);
    }
    setValues(next);
    setFieldErrors({});
  }, [grouped]);

  const mutation = useMutation({
    mutationFn: async () => {
      const errs = validateValues(fields, values);
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        throw new Error('Corrija os campos destacados.');
      }
      setFieldErrors({});
      const payload = buildPayload(fields, values);
      return saveSettings({ settings: payload });
    },
    onSuccess: (res) => {
      queryClient.setQueryData(tenantSettingsQueryKey, res);
      if (res.data) {
        const next: Record<string, unknown> = {};
        for (const f of flattenFields(res.data)) {
          next[f.key] = valueForForm(f);
        }
        setValues(next);
      }
      setBanner({ type: 'success', text: 'Configurações salvas com sucesso.' });
      window.setTimeout(() => setBanner(null), 4000);
    },
    onError: (e: Error) => {
      setBanner({ type: 'error', text: e.message });
    },
  });

  const onChange = useCallback((key: string, next: unknown) => {
    setValues((prev) => ({ ...prev, [key]: next }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const onReset = useCallback(
    (field: TenantSettingField) => {
      setValues((prev) => ({ ...prev, [field.key]: defaultForForm(field) }));
      setFieldErrors((prev) => {
        if (!prev[field.key]) return prev;
        const { [field.key]: _, ...rest } = prev;
        return rest;
      });
    },
    [],
  );

  const filteredGrouped = useMemo(() => {
    if (!grouped) return null;
    const q = search.trim().toLowerCase();
    if (!q) return grouped;
    const out: TenantSettingsGrouped = {};
    for (const [g, items] of Object.entries(grouped)) {
      const kept = items.filter(
        (it) =>
          it.label.toLowerCase().includes(q) ||
          it.key.toLowerCase().includes(q) ||
          (it.description?.toLowerCase().includes(q) ?? false),
      );
      if (kept.length > 0) out[g] = kept;
    }
    return out;
  }, [grouped, search]);

  if (isLoading) {
    return (
      <div className="text-secondary px-4 py-10 text-sm sm:px-6">Carregando configurações…</div>
    );
  }

  if (isError) {
    return (
      <div className="px-4 py-10 sm:px-6" role="alert">
        <p className="text-red-600 dark:text-red-400 text-sm">
          {error instanceof Error ? error.message : 'Não foi possível carregar as configurações.'}
        </p>
      </div>
    );
  }

  if (!filteredGrouped || Object.keys(filteredGrouped).length === 0) {
    return (
      <div className="text-secondary px-4 py-10 text-sm sm:px-6">
        {search.trim()
          ? 'Nenhuma configuração corresponde à busca.'
          : 'Nenhuma configuração cadastrada. Execute o seed de definições na API.'}
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-8rem)] w-full min-w-0 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl min-w-0">
        <header className="mb-6 sm:mb-8">
          <p className="text-muted text-xs font-semibold uppercase tracking-[0.12em]">Sistema</p>
          <h1 className="text-foreground mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Configurações
          </h1>
          <p className="text-secondary mt-2 max-w-prose text-pretty text-sm leading-relaxed">
            Preferências da empresa. Os campos são definidos pelo servidor e podem evoluir sem atualizar o app.
          </p>
        </header>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="text-muted pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              type="search"
              placeholder="Buscar por nome ou chave…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-border text-foreground placeholder:text-placeholder min-h-11 w-full rounded-control border bg-card py-2 pl-10 pr-3 text-sm shadow-input outline-none focus:border-primary/55 focus:ring-2 focus:ring-primary/25"
              aria-label="Buscar configurações"
            />
          </div>
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-control bg-linear-to-br from-primary to-primary-end px-5 text-sm font-semibold text-primary-foreground shadow-cta transition-[transform,opacity] hover:opacity-95 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
          >
            {mutation.isPending ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>

        {banner ? (
          <div
            role="status"
            className={
              banner.type === 'success'
                ? 'mb-6 rounded-control border border-emerald-200 bg-emerald-50/90 px-3.5 py-3 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100'
                : 'mb-6 rounded-control border border-red-200 bg-red-50/90 px-3.5 py-3 text-sm text-red-800 dark:border-red-900/70 dark:bg-red-950/45 dark:text-red-200'
            }
          >
            {banner.text}
          </div>
        ) : null}

        <div className="flex flex-col gap-10">
          {Object.entries(filteredGrouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([groupKey, items]) => (
              <section
                key={groupKey}
                className="rounded-card border border-border bg-card p-5 shadow-card sm:p-8"
                aria-labelledby={`settings-group-${groupKey}`}
              >
                <h2
                  id={`settings-group-${groupKey}`}
                  className="text-foreground mb-6 border-b border-border pb-3 font-display text-lg font-semibold tracking-tight"
                >
                  {groupTitle(groupKey)}
                </h2>
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-x-10 lg:gap-y-8">
                  {items.map((field) => (
                    <SettingField
                      key={field.key}
                      field={field}
                      value={values[field.key]}
                      error={fieldErrors[field.key]}
                      onChange={(next) => onChange(field.key, next)}
                      onResetToDefault={() => onReset(field)}
                    />
                  ))}
                </div>
              </section>
            ))}
        </div>
      </div>
    </div>
  );
}
