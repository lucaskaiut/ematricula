'use client';

import { format, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/cn';
import type { MonthDaySummary } from './hooks/useCalendar';

export type CalendarMonthProps = {
  rows: MonthDaySummary[][];
  onCreateDay?: (day: Date) => void;
};

export function CalendarMonth({ rows, onCreateDay }: CalendarMonthProps) {
  const header = rows[0]?.map((c) => c.day) ?? [];

  return (
    <div className="border-border/70 bg-card overflow-hidden rounded-2xl border shadow-sm">
      <div className="border-border/60 bg-card-subtle/50 grid grid-cols-7 border-b">
        {header.map((d) => (
          <div
            key={format(d, 'yyyy-MM-dd')}
            className="text-muted px-1 py-2 text-center text-[10px] font-medium tracking-wide uppercase sm:px-2 sm:text-[11px]"
          >
            {format(d, 'EEE', { locale: ptBR })}
          </div>
        ))}
      </div>
      <div className="divide-border/50 divide-y">
        {rows.map((week, wi) => (
          <div key={wi} className="divide-border/50 grid grid-cols-7 divide-x">
            {week.map((cell) => (
              <MonthDayCell
                key={format(cell.day, 'yyyy-MM-dd')}
                cell={cell}
                onCreateDay={onCreateDay}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthDayCell({
  cell,
  onCreateDay,
}: {
  cell: MonthDaySummary;
  onCreateDay?: (day: Date) => void;
}) {
  return (
    <div
      role={onCreateDay ? 'button' : undefined}
      tabIndex={onCreateDay ? 0 : undefined}
      className={cn(
        'min-h-[96px] p-1.5 text-left align-top transition-colors sm:min-h-[112px] sm:p-2',
        onCreateDay && 'hover:bg-accent-soft/50 cursor-pointer',
        !cell.inMonth && 'bg-card-subtle/30 text-muted',
      )}
      onClick={() => onCreateDay?.(startOfDay(cell.day))}
      onKeyDown={(e) => {
        if (!onCreateDay) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCreateDay(startOfDay(cell.day));
        }
      }}
    >
      <span
        className={cn(
          'inline-flex h-7 min-w-7 items-center justify-center rounded-full text-xs font-semibold tabular-nums sm:text-sm',
          format(cell.day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') &&
            'bg-primary/15 text-primary',
        )}
      >
        {format(cell.day, 'd')}
      </span>
      <ul className="mt-1.5 space-y-0.5">
        {cell.events.slice(0, 3).map((ev) => (
          <li
            key={ev.instanceKey}
            className="border-border/50 bg-primary text-foreground truncate rounded-md border px-1 py-0.5 text-[10px] leading-tight font-medium"
          >
            {ev.title}
          </li>
        ))}
      </ul>
      {cell.events.length > 3 ? (
        <p className="text-muted mt-1 text-[10px]">
          +{cell.events.length - 3} mais
        </p>
      ) : null}
    </div>
  );
}
