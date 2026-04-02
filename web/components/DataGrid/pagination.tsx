"use client";

import * as React from 'react';

import type { DataGridPaginationProps, PaginationMeta } from './types.ts';

function cx(...parts: Array<string | undefined | null | false>) {
  return parts.filter(Boolean).join(' ');
}

type PageToken = number | 'ellipsis';

function buildPageTokens(current: number, last: number): PageToken[] {
  if (last <= 1) return [1];

  const set = new Set<number>();
  set.add(1);
  set.add(last);
  set.add(current);
  set.add(current - 1);
  set.add(current + 1);

  const pages = Array.from(set)
    .filter(p => p >= 1 && p <= last)
    .sort((a, b) => a - b);

  const out: PageToken[] = [];
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const prev = pages[i - 1];
    if (i > 0 && prev !== undefined && p - prev > 1) out.push('ellipsis');
    out.push(p);
  }
  return out;
}

function PaginationInner({
  meta,
  onPageChange,
  disabled,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  const canPrev = meta.current_page > 1;
  const canNext = meta.current_page < meta.last_page;
  const tokens = React.useMemo(
    () => buildPageTokens(meta.current_page, meta.last_page),
    [meta.current_page, meta.last_page],
  );

  const go = (page: number) => {
    if (disabled) return;
    if (page < 1 || page > meta.last_page) return;
    if (page === meta.current_page) return;
    onPageChange(page);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <div className="text-ematricula-text-muted">
        {meta.total > 0 && meta.from !== null && meta.to !== null
          ? `Mostrando ${meta.from}–${meta.to} de ${meta.total}`
          : `Total: ${meta.total}`}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => go(meta.current_page - 1)}
          disabled={!canPrev || disabled}
          className={cx(
            'min-w-9 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-ematricula-text-primary shadow-sm',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'hover:bg-slate-50',
          )}
          aria-label="Página anterior"
        >
          ‹
        </button>
        {tokens.map((t, idx) =>
          t === 'ellipsis' ? (
            <span
              key={`e-${idx}`}
              className="px-2 py-1.5 text-ematricula-text-muted"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={t}
              type="button"
              onClick={() => go(t)}
              disabled={disabled}
              aria-current={t === meta.current_page ? 'page' : undefined}
              className={cx(
                'min-w-9 rounded-lg border px-2.5 py-1.5 text-ematricula-text-primary shadow-sm transition-colors',
                'disabled:cursor-not-allowed disabled:opacity-50',
                t === meta.current_page
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white hover:bg-slate-50',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40',
              )}
            >
              {t}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => go(meta.current_page + 1)}
          disabled={!canNext || disabled}
          className={cx(
            'min-w-9 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-ematricula-text-primary shadow-sm',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'hover:bg-slate-50',
          )}
          aria-label="Próxima página"
        >
          ›
        </button>
      </div>
    </div>
  );
}

export function DataGridPagination({
  meta,
  onPageChange,
  disabled,
  className,
}: DataGridPaginationProps) {
  return (
    <div
      className={cx(
        'sticky bottom-0 z-20 w-full shrink-0 rounded-b-xl border-t border-slate-200 bg-white px-4 py-3',
        'shadow-[0_-10px_28px_-16px_rgba(15,23,42,0.18)]',
        className,
      )}
    >
      <PaginationInner meta={meta} onPageChange={onPageChange} disabled={disabled} />
    </div>
  );
}
