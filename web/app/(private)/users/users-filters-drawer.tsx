'use client';

import { format, isBefore, isSameDay, isValid, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarRange, ListFilter, X } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker, type DateRange } from 'react-day-picker';

import type { UsersListUrlState } from './users-url-state';

import 'react-day-picker/style.css';

export type UsersFiltersDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  committed: Pick<
    UsersListUrlState,
    'email' | 'createdFrom' | 'createdTo' | 'updatedFrom' | 'updatedTo'
  >;
  onApply: (
    next: Pick<
      UsersListUrlState,
      'email' | 'createdFrom' | 'createdTo' | 'updatedFrom' | 'updatedTo'
    >,
  ) => void;
};

function parseLocalYmd(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isValid(d) ? d : null;
}

function rangeFromIso(from: string, to: string): DateRange | undefined {
  if (!from || !to) return undefined;
  const a = parseLocalYmd(from);
  const b = parseLocalYmd(to);
  if (!a || !b) return undefined;
  return { from: a, to: b };
}

function rangeToIso(range: DateRange | undefined): {
  from: string;
  to: string;
} {
  if (!range?.from || !range.to) return { from: '', to: '' };
  return {
    from: format(range.from, 'yyyy-MM-dd'),
    to: format(range.to, 'yyyy-MM-dd'),
  };
}

function formatRangeDisplay(range: DateRange | undefined): string {
  if (!range?.from) return '';
  if (!range.to) return format(range.from, 'dd/MM/yyyy', { locale: ptBR });
  return `${format(range.from, 'dd/MM/yyyy', { locale: ptBR })} – ${format(range.to, 'dd/MM/yyyy', { locale: ptBR })}`;
}

function nextRangeFromDayClick(
  current: DateRange | undefined,
  clicked: Date,
): { next: DateRange | undefined; closePopover: boolean } {
  const from = current?.from;
  const to = current?.to;
  const hasFrom = Boolean(from);
  const hasTo = Boolean(to);

  if (!hasFrom) {
    return { next: { from: clicked, to: undefined }, closePopover: false };
  }

  if (hasFrom && hasTo) {
    return { next: { from: clicked, to: undefined }, closePopover: false };
  }

  if (isSameDay(from!, clicked)) {
    return { next: { from, to: clicked }, closePopover: true };
  }

  if (isBefore(startOfDay(clicked), startOfDay(from!))) {
    return { next: { from: clicked, to: undefined }, closePopover: false };
  }

  return { next: { from, to: clicked }, closePopover: true };
}

const triggerClass =
  'flex w-full min-h-11 cursor-pointer items-center gap-2 rounded-control border border-border bg-card px-3.5 py-2 text-left text-sm outline-none transition-[box-shadow,border-color] focus:border-primary/55 focus:ring-2 focus:ring-primary/25';

const labelClass = 'text-sm font-medium text-secondary';

const emailInputClass =
  'mt-1.5 w-full min-h-11 rounded-control border border-border bg-card px-3.5 py-2 text-sm text-foreground outline-none focus:border-primary/55 focus:ring-2 focus:ring-primary/25';

type DateRangePopoverFieldProps = {
  fieldId: string;
  label: string;
  hint: string;
  value: DateRange | undefined;
  onChange: (next: DateRange | undefined) => void;
  drawerOpen: boolean;
};

function DateRangePopoverField({
  fieldId,
  label,
  hint,
  value,
  onChange,
  drawerOpen,
}: DateRangePopoverFieldProps) {
  const labelId = `${fieldId}-label`;
  const [pickerOpen, setPickerOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (drawerOpen) return;
    const id = requestAnimationFrame(() => setPickerOpen(false));
    return () => cancelAnimationFrame(id);
  }, [drawerOpen]);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    const pop = popoverRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const gap = 8;
    const ph = pop?.offsetHeight ?? 360;
    const pw = pop?.offsetWidth ?? 640;
    let top = rect.bottom + gap;
    if (top + ph > window.innerHeight - 12) {
      top = Math.max(12, rect.top - gap - ph);
    }
    let left = rect.left;
    if (left + pw > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - pw - 12);
    }
    setCoords({ top, left });
  }, []);

  useEffect(() => {
    if (!pickerOpen) return;
    const id = requestAnimationFrame(() => {
      updatePosition();
      requestAnimationFrame(() => updatePosition());
    });
    return () => cancelAnimationFrame(id);
  }, [pickerOpen, updatePosition]);

  useEffect(() => {
    if (!pickerOpen) return;
    const onScrollOrResize = () => updatePosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [pickerOpen, updatePosition]);

  useEffect(() => {
    if (!pickerOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      const el = e.target;
      if (!(el instanceof Node)) return;
      if (anchorRef.current?.contains(el)) return;
      const root = el instanceof Element ? el : el.parentElement;
      if (root?.closest('[data-users-date-popover]')) return;
      setPickerOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [pickerOpen]);

  const handleSelect = (_range: DateRange | undefined, triggerDate: Date) => {
    const { next, closePopover } = nextRangeFromDayClick(value, triggerDate);
    onChange(next);
    if (closePopover) setPickerOpen(false);
  };

  const display = formatRangeDisplay(value);
  const placeholder = 'Selecione o período';

  const popover =
    pickerOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={popoverRef}
            data-users-date-popover=""
            role="dialog"
            aria-label={label}
            tabIndex={-1}
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              zIndex: 100,
            }}
            className="users-filters-daypicker w-max max-w-[calc(100vw-1rem)] rounded-xl border border-border bg-card p-4 shadow-2xl [--rdp-accent-color:var(--primary)] [--rdp-background-color:var(--accent-soft)]"
          >
            <DayPicker
              mode="range"
              selected={value}
              onSelect={handleSelect}
              locale={ptBR}
              numberOfMonths={2}
            />
          </div>,
          document.body,
        )
      : null;

  return (
    <div>
      <p id={labelId} className={labelClass}>
        {label}
      </p>
      <p className="mt-0.5 text-xs text-muted">{hint}</p>
      <div ref={anchorRef} className="mt-2">
        <button
          type="button"
          id={fieldId}
          aria-labelledby={labelId}
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
          onClick={() => setPickerOpen((wasOpen) => !wasOpen)}
          className={triggerClass}
        >
          <CalendarRange
            className="h-4 w-4 shrink-0 text-muted"
            aria-hidden
          />
          <span
            className={
              display
                ? 'text-foreground'
                : 'text-placeholder'
            }
          >
            {display || placeholder}
          </span>
        </button>
      </div>
      {popover}
    </div>
  );
}

export function UsersFiltersDrawer({
  open,
  onOpenChange,
  committed,
  onApply,
}: UsersFiltersDrawerProps) {
  const titleId = useId();
  const [email, setEmail] = useState(committed.email);
  const [created, setCreated] = useState<DateRange | undefined>(() =>
    rangeFromIso(committed.createdFrom, committed.createdTo),
  );
  const [updated, setUpdated] = useState<DateRange | undefined>(() =>
    rangeFromIso(committed.updatedFrom, committed.updatedTo),
  );

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      setEmail(committed.email);
      setCreated(rangeFromIso(committed.createdFrom, committed.createdTo));
      setUpdated(rangeFromIso(committed.updatedFrom, committed.updatedTo));
    });
    return () => cancelAnimationFrame(id);
  }, [open, committed]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      onOpenChange(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const handleApply = useCallback(() => {
    const c = rangeToIso(created);
    const u = rangeToIso(updated);
    onApply({
      email: email.trim(),
      createdFrom: c.from,
      createdTo: c.to,
      updatedFrom: u.from,
      updatedTo: u.to,
    });
    onOpenChange(false);
  }, [created, email, onApply, onOpenChange, updated]);

  const handleClearAll = useCallback(() => {
    setEmail('');
    setCreated(undefined);
    setUpdated(undefined);
    onApply({
      email: '',
      createdFrom: '',
      createdTo: '',
      updatedFrom: '',
      updatedTo: '',
    });
    onOpenChange(false);
  }, [onApply, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-overlay backdrop-blur-[2px]"
        aria-label="Fechar filtros"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-x-visible border-l border-border bg-card shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-4">
          <div className="flex items-center gap-2">
            <ListFilter
              className="h-5 w-5 text-muted"
              aria-hidden
            />
            <h2
              id={titleId}
              className="text-lg font-semibold text-foreground"
            >
              Filtros
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-2 text-muted hover:bg-accent hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overflow-x-visible overscroll-contain px-4 py-5">
          <div>
            <label htmlFor="filter-email" className={labelClass}>
              E-mail
            </label>
            <input
              id="filter-email"
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={emailInputClass}
              placeholder="Contém…"
            />
          </div>

          <DateRangePopoverField
            fieldId="filter-created-range"
            label="Data de criação"
            hint="Toque para escolher o intervalo (dois meses lado a lado)."
            value={created}
            onChange={setCreated}
            drawerOpen={open}
          />

          <DateRangePopoverField
            fieldId="filter-updated-range"
            label="Data de atualização"
            hint="Última alteração do registro — intervalo com início e fim."
            value={updated}
            onChange={setUpdated}
            drawerOpen={open}
          />
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-border bg-card/90 px-4 py-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-control bg-linear-to-br from-primary to-primary-end px-4 text-sm font-semibold text-primary-foreground shadow-cta transition-opacity hover:opacity-95"
          >
            Aplicar filtros
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex min-h-10 w-full items-center justify-center rounded-control text-sm font-medium text-secondary ring-1 ring-border transition-colors hover:bg-accent"
          >
            Limpar tudo
          </button>
        </div>
      </div>
    </div>
  );
}
