'use client';

import { useMemo } from 'react';

import { cn } from '@/lib/cn';

const WEEKDAY_OPTIONS: { id: number; label: string }[] = [
  { id: 0, label: 'Domingo' },
  { id: 1, label: 'Segunda' },
  { id: 2, label: 'Terça' },
  { id: 3, label: 'Quarta' },
  { id: 4, label: 'Quinta' },
  { id: 5, label: 'Sexta' },
  { id: 6, label: 'Sábado' },
];

export type WeekdayPickerProps = {
  value: number[];
  onChange: (next: number[]) => void;
  disabled?: boolean;
};

export function WeekdayPicker({ value, onChange, disabled }: WeekdayPickerProps) {
  const selected = useMemo(() => new Set(value), [value]);

  const toggle = (id: number) => {
    if (disabled) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next].sort((a, b) => a - b));
  };

  return (
    <div className={cn('space-y-3', disabled && 'pointer-events-none opacity-60')}>
      <div>
        <p className="text-sm font-medium text-secondary">Dias da semana</p>
        <p className="mt-0.5 text-xs text-muted">Selecione um ou mais dias.</p>
      </div>

      <ul
        className="flex flex-wrap gap-1.5"
        role="listbox"
        aria-label="Dias da semana"
        aria-multiselectable="true"
      >
        {WEEKDAY_OPTIONS.map((d) => {
          const isOn = selected.has(d.id);
          return (
            <li key={d.id} className="list-none">
              <button
                type="button"
                role="option"
                aria-selected={isOn}
                onClick={() => toggle(d.id)}
                className={cn(
                  'max-w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors',
                  isOn
                    ? 'bg-primary font-medium text-primary-foreground'
                    : 'text-foreground hover:bg-accent',
                )}
              >
                <span className="block truncate">{d.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
