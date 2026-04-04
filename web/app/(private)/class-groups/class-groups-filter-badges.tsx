'use client';

import { X } from 'lucide-react';

import type { ClassGroupsListUrlState } from './class-groups-url-state';

export type ClassGroupsFilterBadgesProps = {
  state: ClassGroupsListUrlState;
  modalityLabel?: string;
  teacherLabel?: string;
  onClearName: () => void;
  onClearModality: () => void;
  onClearTeacher: () => void;
};

export function ClassGroupsFilterBadges({
  state,
  modalityLabel,
  teacherLabel,
  onClearName,
  onClearModality,
  onClearTeacher,
}: ClassGroupsFilterBadgesProps) {
  const chips: { key: string; label: string; onClear: () => void }[] = [];

  if (state.name.trim()) {
    chips.push({
      key: 'name',
      label: `Nome: ${state.name.trim()}`,
      onClear: onClearName,
    });
  }
  if (state.modalityId !== null) {
    chips.push({
      key: 'modality',
      label: `Modalidade: ${modalityLabel ?? `#${state.modalityId}`}`,
      onClear: onClearModality,
    });
  }
  if (state.teacherPersonId !== null) {
    chips.push({
      key: 'teacher',
      label: `Professor: ${teacherLabel ?? `#${state.teacherPersonId}`}`,
      onClear: onClearTeacher,
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c) => (
        <span
          key={c.key}
          className="inline-flex max-w-full items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-foreground"
        >
          <span className="min-w-0 truncate">{c.label}</span>
          <button
            type="button"
            onClick={c.onClear}
            className="shrink-0 rounded-full p-0.5 text-muted hover:bg-accent hover:text-foreground"
            aria-label={`Remover filtro ${c.key}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      ))}
    </div>
  );
}
