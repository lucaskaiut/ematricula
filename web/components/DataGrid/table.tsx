'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';

import { useColumnVisibility, useContainerWidth } from './hooks';
import type { Column, ColumnAlignment, DataGridTableProps } from './types.ts';

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
  if (typeof col.width === 'number' && Number.isFinite(col.width) && col.width > 0) {
    return Math.trunc(col.width);
  }
  if (typeof col.minWidth === 'number' && Number.isFinite(col.minWidth) && col.minWidth > 0) {
    return Math.trunc(col.minWidth);
  }
  const p = typeof col.priority === 'number' && Number.isFinite(col.priority) ? col.priority : 999;
  if (p <= 1) return 240;
  if (p <= 2) return 200;
  return 180;
}

function computeColumnWidths<T>(input: {
  columns: Column<T>[];
  containerWidth: number | null;
  canExpand: boolean;
  hasRowActions: boolean;
}) {
  const { columns, containerWidth, canExpand, hasRowActions } = input;
  const base = columns.map((c) => minWidthForColumn(c));

  if (containerWidth === null) return base;

  const GAP = 12;
  const PADDING = 32;
  const EXPANDER = canExpand ? 44 : 0;
  const ACTIONS = hasRowActions ? 40 : 0;

  const gaps = Math.max(0, columns.length - 1) * GAP;
  const available = containerWidth - PADDING - EXPANDER - ACTIONS - gaps;

  const sumBase = base.reduce((acc, v) => acc + v, 0);
  if (!Number.isFinite(available) || available <= sumBase) return base;

  const extra = available - sumBase;
  const weightsSum = sumBase > 0 ? sumBase : columns.length;

  const expanded = base.map((b) => {
    const weight = sumBase > 0 ? b : 1;
    const add = Math.floor((extra * weight) / weightsSum);
    return b + add;
  });

  const sumExpanded = expanded.reduce((acc, v) => acc + v, 0);
  let remainder = available - sumExpanded;
  for (let i = 0; i < expanded.length && remainder > 0; i++) {
    expanded[i] += 1;
    remainder -= 1;
  }

  return expanded;
}

function renderValue<T>(row: T, col: Column<T>) {
  if (col.render) return col.render(row);
  const key = col.key as keyof T;
  const value =
    typeof col.key === 'string' && !(col.key in (row as object))
      ? (row as Record<string, unknown>)[col.key]
      : (row as T)[key];
  if (col.format) return col.format(value, row);
  if (value === null || value === undefined)
    return <span className="text-muted">—</span>;
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return <span className="text-muted">—</span>;
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

function SortIcon({ direction, active }: { direction: 'asc' | 'desc'; active?: boolean }) {
  const base = 'h-3 w-3';
  const color = active ? 'text-foreground' : 'text-muted';
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
      <div className="h-4 w-full animate-pulse rounded bg-skeleton" />
    </div>
  );
}

const DG_MENU_WIDTH_PX = 176;
const DG_MENU_MIN_HEIGHT_PX = 90;
const DG_MENU_GAP_PX = 4;

function computeDataGridActionMenuPosition(btn: DOMRect) {
  const spaceBelow = window.innerHeight - btn.bottom - DG_MENU_GAP_PX;
  const openUpward =
    spaceBelow < DG_MENU_MIN_HEIGHT_PX && btn.top > DG_MENU_MIN_HEIGHT_PX + DG_MENU_GAP_PX;
  const top = openUpward
    ? btn.top - DG_MENU_MIN_HEIGHT_PX - DG_MENU_GAP_PX
    : btn.bottom + DG_MENU_GAP_PX;
  let left = btn.right - DG_MENU_WIDTH_PX;
  left = Math.max(8, Math.min(left, window.innerWidth - DG_MENU_WIDTH_PX - 8));

  return { top, left };
}

function SkeletonRow<T>({ cols }: { cols: Column<T>[] }) {
  return (
    <div className="grid grid-cols-12 items-center gap-3 rounded-xl px-4 py-3">
      {cols.map((c, idx) => (
        <div
          key={`${String(c.key)}-${idx}`}
          className={cx('col-span-12 sm:col-span-6 lg:col-span-3', 'min-w-0')}
        >
          <SkeletonCell align={c.align} />
        </div>
      ))}
    </div>
  );
}

export function DataGridTable<T>({
  data,
  columns,
  loading = false,
  sort = [],
  onSortChange,
  onEdit,
  onDelete,
  getRowId,
  emptyState,
  className,
  rowClassName,
}: DataGridTableProps<T>) {
  const { ref: containerRef, width: containerWidth } = useContainerWidth<HTMLDivElement>();
  const { visible, hidden } = useColumnVisibility(columns, containerWidth);

  const [openRows, setOpenRows] = React.useState<Record<string, boolean>>({});
  const [openActionMenuKey, setOpenActionMenuKey] = React.useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = React.useState<{
    top: number;
    left: number;
  } | null>(null);
  const actionMenuAnchorRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
  const hasData = data.length > 0;
  const firstLoad = loading && !hasData;
  const showOverlay = loading && hasData;
  const canExpand = hidden.length > 0;
  const hasRowActions = !!onEdit || !!onDelete;

  React.useEffect(() => {
    if (!canExpand) {
      setOpenRows({});
    }
  }, [canExpand]);

  React.useEffect(() => {
    if (!hasRowActions) setOpenActionMenuKey(null);
  }, [hasRowActions]);

  const syncActionMenuPosition = React.useCallback(() => {
    if (!openActionMenuKey) {
      setActionMenuPosition(null);
      return;
    }
    const btn = actionMenuAnchorRefs.current.get(openActionMenuKey);
    if (!btn) return;
    setActionMenuPosition(computeDataGridActionMenuPosition(btn.getBoundingClientRect()));
  }, [openActionMenuKey]);

  React.useLayoutEffect(() => {
    syncActionMenuPosition();
  }, [syncActionMenuPosition]);

  React.useEffect(() => {
    if (!openActionMenuKey) return;
    const onScrollOrResize = () => syncActionMenuPosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [openActionMenuKey, syncActionMenuPosition]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenActionMenuKey(null);
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-dg-action-menu]')) return;
      setOpenActionMenuKey(null);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown, { capture: true } as never);
    };
  }, []);

  const headerColumns = React.useMemo(() => visible, [visible]);
  const headerColumnWidths = React.useMemo(() => {
    return computeColumnWidths<T>({
      columns: headerColumns,
      containerWidth,
      canExpand,
      hasRowActions,
    });
  }, [canExpand, containerWidth, hasRowActions, headerColumns]);

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

      const next = current === null ? 'asc' : current === 'asc' ? 'desc' : null;

      if (next === null) {
        onSortChange(sort.filter((s) => s.key !== key));
        return;
      }

      if (current === null) {
        onSortChange([...sort, { key, direction: next }]);
        return;
      }

      onSortChange(sort.map((s) => (s.key === key ? { key, direction: next } : s)));
    },
    [onSortChange, sort, sortKeyForColumn, sortLookup],
  );

  const toggleRow = React.useCallback((key: React.Key) => {
    setOpenRows((prev) => {
      const str = String(key);
      const next = !prev[str];
      return { ...prev, [str]: next };
    });
  }, []);

  const toggleActionMenu = React.useCallback((rowKey: React.Key) => {
    setOpenActionMenuKey((prev) => {
      const next = String(rowKey);
      if (prev === next) {
        setActionMenuPosition(null);
        return null;
      }
      return next;
    });
  }, []);

  const onActionEdit = React.useCallback(
    (row: T) => {
      onEdit?.(row);
      setOpenActionMenuKey(null);
      setActionMenuPosition(null);
    },
    [onEdit],
  );

  const onActionDelete = React.useCallback(
    (row: T) => {
      onDelete?.(row);
      setOpenActionMenuKey(null);
      setActionMenuPosition(null);
    },
    [onDelete],
  );

  const actionMenuRow = React.useMemo(() => {
    if (!openActionMenuKey) return null;
    for (let i = 0; i < data.length; i++) {
      const row = data[i]!;
      if (String(stableRowKey(row, i, getRowId)) === openActionMenuKey) {
        return row;
      }
    }
    return null;
  }, [openActionMenuKey, data, getRowId]);

  const actionMenuPortal =
    typeof document !== 'undefined' &&
    openActionMenuKey &&
    actionMenuPosition &&
    actionMenuRow &&
    (onEdit || onDelete)
      ? createPortal(
          <div
            data-dg-action-menu
            role="menu"
            aria-label="Ações da linha"
            className={cx(
              'fixed z-100 min-w-44 overflow-hidden rounded-xl border border-border bg-card shadow-lg',
            )}
            style={{
              top: actionMenuPosition.top,
              left: actionMenuPosition.left,
              width: DG_MENU_WIDTH_PX,
            }}
          >
            {onEdit ? (
              <button
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onActionEdit(actionMenuRow);
                }}
                className={cx(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground',
                  'hover:bg-accent',
                )}
              >
                Editar
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onActionDelete(actionMenuRow);
                }}
                className={cx(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400',
                  'hover:bg-red-500/10 dark:hover:bg-red-500/20',
                )}
              >
                Excluir
              </button>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      ref={containerRef}
      className={cx('relative w-full shrink-0 overflow-hidden rounded-t-xl', className)}
    >
      <div className="bg-card">
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-muted">
            {canExpand ? <div className="w-8 shrink-0" /> : null}
            {hasRowActions ? <div className="w-10 shrink-0" /> : null}
            {headerColumns.map((col, idx) => (
              <div
                key={`${String(col.key)}-${idx}`}
                className={cx('min-w-0 whitespace-nowrap', alignClass(col.align))}
                style={{
                  flex: '0 0 auto',
                  width: headerColumnWidths[idx],
                  minWidth: minWidthForColumn(col),
                }}
              >
                {isSortable(col) ? (
                  <button
                    type="button"
                    onClick={() => toggleSort(col)}
                    className={cx(
                      'group inline-flex max-w-full items-center gap-2 truncate rounded-md',
                      'hover:text-foreground',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
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

        <div
          className={cx('relative', showOverlay ? 'pointer-events-none select-none' : undefined)}
        >
          {firstLoad ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="px-1 py-1">
                  <SkeletonRow cols={headerColumns} />
                </div>
              ))}
            </div>
          ) : !hasData ? (
            <div className="px-6 py-10 text-center text-sm text-muted">
              {emptyState ?? 'Nenhum resultado encontrado.'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.map((row, index) => {
                const rowKey = stableRowKey(row, index, getRowId);
                const rowKeyStr = String(rowKey);
                const open = !!openRows[rowKeyStr];
                const rowHasHidden = canExpand;

                return (
                  <div key={rowKey} className={cx('group', rowClassName?.(row))}>
                    <div
                      role={rowHasHidden ? 'button' : undefined}
                      tabIndex={rowHasHidden ? 0 : undefined}
                      aria-expanded={rowHasHidden ? open : undefined}
                      onClick={rowHasHidden ? () => toggleRow(rowKey) : undefined}
                      onKeyDown={
                        rowHasHidden
                          ? (e) => {
                              if (e.key !== 'Enter' && e.key !== ' ') return;
                              e.preventDefault();
                              toggleRow(rowKey);
                            }
                          : undefined
                      }
                      className={cx(
                        'w-full text-left',
                        'px-4 py-3',
                        'transition-colors',
                        rowHasHidden ? 'cursor-pointer hover:bg-accent' : 'cursor-default',
                        rowHasHidden
                          ? 'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
                          : undefined,
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {rowHasHidden ? (
                          <div className="w-8 shrink-0 text-muted">
                            <Chevron open={open} />
                          </div>
                        ) : null}

                        {hasRowActions ? (
                          <div className="relative w-10 shrink-0" data-dg-action-menu>
                            <button
                              type="button"
                              ref={(el) => {
                                if (el) actionMenuAnchorRefs.current.set(rowKeyStr, el);
                                else actionMenuAnchorRefs.current.delete(rowKeyStr);
                              }}
                              aria-haspopup="menu"
                              aria-expanded={openActionMenuKey === rowKeyStr}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleActionMenu(rowKey);
                              }}
                              className={cx(
                                'inline-flex h-9 w-9 items-center justify-center rounded-lg',
                                'text-muted hover:bg-accent hover:text-foreground',
                                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                              )}
                            >
                              <span className="sr-only">Ações</span>
                              <svg
                                aria-hidden="true"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="h-5 w-5"
                              >
                                <path d="M6 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm5.5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM17 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                              </svg>
                            </button>
                          </div>
                        ) : null}

                        {headerColumns.map((col, idx) => (
                          <div
                            key={`${String(col.key)}-${idx}`}
                            className={cx(
                              'min-w-0 whitespace-nowrap text-sm text-foreground',
                              alignClass(col.align),
                            )}
                            style={{
                              flex: '0 0 auto',
                              width: headerColumnWidths[idx],
                              minWidth: minWidthForColumn(col),
                            }}
                          >
                            <div className="truncate">{renderValue(row, col)}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {rowHasHidden ? (
                      <div
                        className={cx(
                          'grid transition-[grid-template-rows] duration-200 ease-out',
                          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                          'bg-accent/60',
                        )}
                      >
                        <div className="overflow-hidden">
                          <div className="px-4 pb-4 pt-2">
                            <div className="grid gap-3 sm:grid-cols-2">
                              {hidden.map((col, idx) => (
                                <div key={`${String(col.key)}-${idx}`} className="min-w-0">
                                  <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                                    {col.title}
                                  </div>
                                  <div
                                    className={cx(
                                      'mt-1 text-sm text-foreground',
                                      alignClass(col.align),
                                    )}
                                  >
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
              <div className="absolute inset-0 bg-foreground/10 backdrop-blur-[1px]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-xl bg-card/80 px-4 py-2 text-sm text-secondary shadow-sm">
                  Carregando…
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {actionMenuPortal}
    </div>
  );
}
