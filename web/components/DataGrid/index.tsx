"use client";

import * as React from 'react';

import { useColumnVisibility, useContainerWidth } from './hooks';
import type { Column, ColumnAlignment, DataGridProps, PaginationMeta } from './types.ts';

function cx(...parts: Array<string | undefined | null | false>) {
  return parts.filter(Boolean).join(' ');
}

function alignClass(align?: ColumnAlignment) {
  if (align === 'center') return 'text-center';
  if (align === 'right') return 'text-right';
  return 'text-left';
}

function stableRowKey<T>(row: T, index: number, getRowId?: (row: T) => React.Key) {
  const fromGetter = getRowId?.(row);
  if (fromGetter !== undefined && fromGetter !== null) return fromGetter;
  const maybeId = (row as { id?: React.Key } | null)?.id;
  if (maybeId !== undefined && maybeId !== null) return maybeId;
  return index;
}

function minWidthForColumn<T>(col: Column<T>) {
  if (typeof col.minWidth === 'number' && Number.isFinite(col.minWidth) && col.minWidth > 0) {
    return Math.trunc(col.minWidth);
  }
  const p = typeof col.priority === 'number' && Number.isFinite(col.priority) ? col.priority : 999;
  if (p <= 1) return 240;
  if (p <= 2) return 200;
  return 180;
}

function renderValue<T>(row: T, col: Column<T>) {
  if (col.render) return col.render(row);
  const key = col.key as keyof T;
  const value =
    typeof col.key === 'string' && !(col.key in (row as object))
      ? (row as Record<string, unknown>)[col.key]
      : (row as T)[key];
  if (col.format) return col.format(value, row);
  if (value === null || value === undefined) return <span className="text-ematricula-text-muted">—</span>;
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return <span className="text-ematricula-text-muted">—</span>;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={cx(
        'h-4 w-4 shrink-0 transition-transform duration-200',
        open ? 'rotate-180' : 'rotate-0',
      )}
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.937a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SortIcon({
  direction,
  active,
}: {
  direction: 'asc' | 'desc';
  active?: boolean;
}) {
  const base = 'h-3 w-3';
  const color = active ? 'text-ematricula-text-primary' : 'text-ematricula-text-muted';
  if (direction === 'asc') {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className={cx(base, color)} fill="currentColor">
        <path d="M10 6.5 6.5 10a.75.75 0 0 1-1.06-1.06l4.03-4.03a.75.75 0 0 1 1.06 0l4.03 4.03A.75.75 0 0 1 13.5 10L10 6.5Z" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={cx(base, color)} fill="currentColor">
      <path d="M10 13.5 13.5 10a.75.75 0 0 1 1.06 1.06l-4.03 4.03a.75.75 0 0 1-1.06 0l-4.03-4.03A.75.75 0 0 1 6.5 10L10 13.5Z" />
    </svg>
  );
}

function SkeletonCell({ align }: { align?: ColumnAlignment }) {
  return (
    <div className={cx('min-w-0', alignClass(align))}>
      <div className="h-4 w-full animate-pulse rounded bg-slate-200/70" />
    </div>
  );
}

function SkeletonRow<T>({ cols }: { cols: Column<T>[] }) {
  return (
    <div className="grid grid-cols-12 items-center gap-3 rounded-xl px-4 py-3">
      {cols.map((c, idx) => (
        <div
          key={`${String(c.key)}-${idx}`}
          className={cx(
            'col-span-12 sm:col-span-6 lg:col-span-3',
            'min-w-0',
          )}
        >
          <SkeletonCell align={c.align} />
        </div>
      ))}
    </div>
  );
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

function Pagination({
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
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
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
            'rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-ematricula-text-primary shadow-sm',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'hover:bg-slate-50',
            'min-w-9',
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
            'rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-ematricula-text-primary shadow-sm',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'hover:bg-slate-50',
            'min-w-9',
          )}
          aria-label="Próxima página"
        >
          ›
        </button>
      </div>
    </div>
  );
}

export function DataGrid<T>({
  data,
  columns,
  loading = false,
  meta,
  onPageChange,
  sort = [],
  onSortChange,
  getRowId,
  emptyState,
  className,
  rowClassName,
}: DataGridProps<T>) {
  const { ref: containerRef, width: containerWidth } = useContainerWidth<HTMLDivElement>();
  const { visible, hidden } = useColumnVisibility(columns, containerWidth);

  const [openRows, setOpenRows] = React.useState<Record<string, boolean>>({});
  const hasData = data.length > 0;
  const firstLoad = loading && !hasData;
  const showOverlay = loading && hasData;
  const canExpand = hidden.length > 0;

  React.useEffect(() => {
    if (!canExpand) {
      setOpenRows({});
    }
  }, [canExpand]);

  const headerColumns = React.useMemo(() => visible, [visible]);

  const sortKeyForColumn = React.useCallback((col: Column<T>) => {
    if (col.sortKey) return col.sortKey;
    return typeof col.key === 'string' ? col.key : String(col.key);
  }, []);

  const isSortable = React.useCallback(
    (col: Column<T>) => !!col.sortable && !!onSortChange,
    [onSortChange],
  );

  const sortLookup = React.useMemo(() => {
    const map = new Map<string, 'asc' | 'desc'>();
    for (const s of sort) map.set(s.key, s.direction);
    return map;
  }, [sort]);

  const toggleSort = React.useCallback(
    (col: Column<T>) => {
      if (!onSortChange) return;
      const key = sortKeyForColumn(col);
      const current = sortLookup.get(key) ?? null;

      const next =
        current === null ? 'asc'
        : current === 'asc' ? 'desc'
        : null;

      if (next === null) {
        onSortChange(sort.filter(s => s.key !== key));
        return;
      }

      if (current === null) {
        onSortChange([...sort, { key, direction: next }]);
        return;
      }

      onSortChange(sort.map(s => (s.key === key ? { key, direction: next } : s)));
    },
    [onSortChange, sort, sortKeyForColumn, sortLookup],
  );

  const toggleRow = React.useCallback((key: React.Key) => {
    setOpenRows(prev => {
      const str = String(key);
      const next = !prev[str];
      return { ...prev, [str]: next };
    });
  }, []);

  return (
    <div ref={containerRef} className={cx('relative w-full overflow-hidden', className)}>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-ematricula-text-muted">
            {canExpand ? <div className="w-8 shrink-0" /> : null}
            {headerColumns.map((col, idx) => (
              <div
                key={`${String(col.key)}-${idx}`}
                className={cx(
                  'min-w-0 flex-1 whitespace-nowrap',
                  alignClass(col.align),
                )}
                style={{ minWidth: minWidthForColumn(col) }}
              >
                {isSortable(col) ? (
                  <button
                    type="button"
                    onClick={() => toggleSort(col)}
                    className={cx(
                      'group inline-flex max-w-full items-center gap-2 truncate rounded-md',
                      'hover:text-ematricula-text-primary',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40',
                    )}
                  >
                    <span className="truncate">{col.title}</span>
                    <span className="inline-flex flex-col leading-none">
                      <SortIcon
                        direction="asc"
                        active={sortLookup.get(sortKeyForColumn(col)) === 'asc'}
                      />
                      <SortIcon
                        direction="desc"
                        active={sortLookup.get(sortKeyForColumn(col)) === 'desc'}
                      />
                    </span>
                  </button>
                ) : (
                  <div className="truncate">{col.title}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={cx('relative', showOverlay ? 'pointer-events-none select-none' : undefined)}>
          {firstLoad ? (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="px-1 py-1">
                  <SkeletonRow cols={headerColumns} />
                </div>
              ))}
            </div>
          ) : !hasData ? (
            <div className="px-6 py-10 text-center text-sm text-ematricula-text-muted">
              {emptyState ?? 'Nenhum resultado encontrado.'}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.map((row, index) => {
                const rowKey = stableRowKey(row, index, getRowId);
                const rowKeyStr = String(rowKey);
                const open = !!openRows[rowKeyStr];
                const rowHasHidden = canExpand;

                return (
                  <div
                    key={rowKey}
                    className={cx(
                      'group',
                      rowClassName?.(row),
                    )}
                  >
                    <button
                      type="button"
                      onClick={rowHasHidden ? () => toggleRow(rowKey) : undefined}
                      disabled={!rowHasHidden}
                      className={cx(
                        'w-full text-left',
                        'px-4 py-3',
                        'transition-colors',
                        rowHasHidden ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default',
                        rowHasHidden ? 'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40' : undefined,
                        'disabled:opacity-100',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {rowHasHidden ? (
                          <div className="w-8 shrink-0 text-ematricula-text-muted">
                            <Chevron open={open} />
                          </div>
                        ) : null}

                        {headerColumns.map((col, idx) => (
                          <div
                            key={`${String(col.key)}-${idx}`}
                            className={cx(
                              'min-w-0 flex-1 whitespace-nowrap text-sm text-ematricula-text-primary',
                              alignClass(col.align),
                            )}
                            style={{ minWidth: minWidthForColumn(col) }}
                          >
                            <div className="truncate">{renderValue(row, col)}</div>
                          </div>
                        ))}
                      </div>
                    </button>

                    {rowHasHidden ? (
                      <div
                        className={cx(
                          'grid transition-[grid-template-rows] duration-200 ease-out',
                          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                          'bg-slate-50/60',
                        )}
                      >
                        <div className="overflow-hidden">
                          <div className="px-4 pb-4 pt-2">
                            <div className="grid gap-3 sm:grid-cols-2">
                              {hidden.map((col, idx) => (
                                <div key={`${String(col.key)}-${idx}`} className="min-w-0">
                                  <div className="text-xs font-semibold uppercase tracking-wide text-ematricula-text-muted">
                                    {col.title}
                                  </div>
                                  <div className={cx('mt-1 text-sm text-ematricula-text-primary', alignClass(col.align))}>
                                    <div className="min-w-0 truncate">{renderValue(row, col)}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          {showOverlay ? (
            <div className="absolute inset-0 z-10">
              <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-xl bg-white/80 px-4 py-2 text-sm text-ematricula-text-secondary shadow-sm">
                  Carregando…
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {meta && onPageChange ? (
        <Pagination meta={meta} onPageChange={onPageChange} disabled={loading} />
      ) : null}
    </div>
  );
}

export type { Column, DataGridProps, PaginationMeta } from './types.ts';
