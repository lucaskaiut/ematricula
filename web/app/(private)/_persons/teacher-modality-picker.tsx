'use client';

import { useMemo, useState } from 'react';

import { cn } from '@/lib/cn';
import type { ModalityAttributes } from '@/types/api';

export type TeacherModalityPickerProps = {
  options: ModalityAttributes[];
  value: number[];
  onChange: (next: number[]) => void;
  disabled?: boolean;
};

export function TeacherModalityPicker({
  options,
  value,
  onChange,
  disabled,
}: TeacherModalityPickerProps) {
  const [query, setQuery] = useState('');
  const selected = useMemo(() => new Set(value), [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((m) => {
      const name = m.name.toLowerCase();
      const desc = (m.description ?? '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [options, query]);

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
        <p className="text-sm font-medium text-ematricula-text-secondary">Modalidades</p>
        <p className="mt-0.5 text-xs text-ematricula-text-muted">
          Selecione uma ou mais. A busca filtra a lista abaixo.
        </p>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar…"
        autoComplete="off"
        className="w-full min-h-10 border-0 border-b border-slate-200 bg-transparent px-0 py-2 text-sm text-ematricula-text-primary outline-none transition-colors placeholder:text-ematricula-text-placeholder focus:border-slate-400"
        aria-label="Filtrar modalidades"
      />

      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-ematricula-text-muted">
          {options.length === 0
            ? 'Nenhuma modalidade cadastrada.'
            : 'Nenhum resultado.'}
        </p>
      ) : (
        <ul
          className="flex max-h-[min(20rem,45vh)] flex-wrap gap-1.5 overflow-y-auto overscroll-contain"
          role="listbox"
          aria-label="Modalidades"
          aria-multiselectable="true"
        >
          {filtered.map((m) => {
            const isOn = selected.has(m.id);
            return (
              <li key={m.id} className="list-none">
                <button
                  type="button"
                  role="option"
                  aria-selected={isOn}
                  onClick={() => toggle(m.id)}
                  className={cn(
                    'max-w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors',
                    isOn
                      ? 'bg-slate-900 font-medium text-white'
                      : 'text-ematricula-text-primary hover:bg-slate-100',
                  )}
                >
                  <span className="block truncate">{m.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
