'use client';

import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { TenantSettingField } from '@/types/api';

const inputClass =
  'mt-1.5 w-full min-h-11 rounded-control border border-border bg-card px-3.5 py-2.5 text-sm text-foreground shadow-input outline-none transition-[box-shadow,border-color] placeholder:text-placeholder focus:border-primary/55 focus:ring-2 focus:ring-primary/25';

const labelClass = 'text-sm font-medium text-secondary';

function formatJsonForForm(value: unknown): string {
  if (value === null || value === undefined) return '{}';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export type SettingFieldProps = {
  field: TenantSettingField;
  value: unknown;
  error?: string | null;
  onChange: (next: unknown) => void;
  onResetToDefault: () => void;
};

export function SettingField({
  field,
  value,
  error,
  onChange,
  onResetToDefault,
}: SettingFieldProps) {
  const id = `setting-${field.key.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const description = field.description?.trim();

  const labelRow = (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor={id} className={labelClass}>
        {field.label}
      </label>
      {description ? (
        <span className="inline-flex" title={description}>
          <HelpCircle
            className="text-muted h-4 w-4 shrink-0"
            aria-hidden
          />
          <span className="sr-only">{description}</span>
        </span>
      ) : null}
    </div>
  );

  if (field.type === 'boolean') {
    const checked = Boolean(value);
    return (
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {labelRow}
          <button
            type="button"
            className="text-secondary hover:text-foreground text-xs font-medium underline-offset-2 hover:underline"
            onClick={onResetToDefault}
          >
            Restaurar padrão
          </button>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-3">
            <input
              id={id}
              type="checkbox"
              className="sr-only"
              checked={checked}
              onChange={(e) => onChange(e.target.checked)}
            />
            <span
              className={cn(
                'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border p-0.5 transition-colors',
                checked
                  ? 'border-primary/40 bg-primary'
                  : 'border-border bg-card-subtle shadow-inner',
              )}
              aria-hidden
            >
              <span
                className={cn(
                  'block h-5 w-5 rounded-full bg-card shadow transition-[margin] duration-200 ease-out',
                  checked ? 'ml-auto' : '',
                )}
              />
            </span>
            <span className="text-secondary text-sm">{checked ? 'Ativado' : 'Desativado'}</span>
          </label>
        </div>
        {error ? (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (field.type === 'number') {
    const n = typeof value === 'number' && Number.isFinite(value) ? value : Number(value);
    const display = Number.isFinite(n) ? String(n) : '';
    return (
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          {labelRow}
          <button
            type="button"
            className="text-secondary hover:text-foreground shrink-0 text-xs font-medium underline-offset-2 hover:underline"
            onClick={onResetToDefault}
          >
            Restaurar padrão
          </button>
        </div>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step="any"
          className={inputClass}
          aria-invalid={!!error}
          value={display}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === '' || raw === '-') {
              onChange('');
              return;
            }
            const parsed = Number(raw);
            onChange(Number.isFinite(parsed) ? parsed : raw);
          }}
        />
        {error ? (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (field.type === 'select') {
    const opts = field.options ?? [];
    const str = value === null || value === undefined ? '' : String(value);
    return (
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          {labelRow}
          <button
            type="button"
            className="text-secondary hover:text-foreground shrink-0 text-xs font-medium underline-offset-2 hover:underline"
            onClick={onResetToDefault}
          >
            Restaurar padrão
          </button>
        </div>
        <select
          id={id}
          className={cn(
            inputClass,
            'min-h-11 appearance-none bg-size-[1rem] bg-position-[right_0.75rem_center] bg-no-repeat pr-10',
          )}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
          }}
          aria-invalid={!!error}
          value={str}
          onChange={(e) => onChange(e.target.value)}
        >
          {opts.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {error ? (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (field.type === 'json') {
    const text = formatJsonForForm(value);
    return (
      <div className="min-w-0 lg:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          {labelRow}
          <button
            type="button"
            className="text-secondary hover:text-foreground shrink-0 text-xs font-medium underline-offset-2 hover:underline"
            onClick={onResetToDefault}
          >
            Restaurar padrão
          </button>
        </div>
        <textarea
          id={id}
          rows={8}
          spellCheck={false}
          className={cn(inputClass, 'font-mono text-xs leading-relaxed')}
          aria-invalid={!!error}
          value={text}
          onChange={(e) => onChange(e.target.value)}
        />
        {error ? (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  const strVal = value === null || value === undefined ? '' : String(value);
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        {labelRow}
        <button
          type="button"
          className="text-secondary hover:text-foreground shrink-0 text-xs font-medium underline-offset-2 hover:underline"
          onClick={onResetToDefault}
        >
          Restaurar padrão
        </button>
      </div>
      <input
        id={id}
        type="text"
        autoComplete="off"
        className={inputClass}
        aria-invalid={!!error}
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
