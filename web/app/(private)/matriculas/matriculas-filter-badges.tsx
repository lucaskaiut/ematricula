'use client';

import { X } from 'lucide-react';

import type { MatriculasListUrlState } from './matriculas-url-state';

function Badge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground shadow-sm">
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 rounded-full p-0.5 text-muted transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Remover filtro"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </span>
  );
}

function statusLabel(s: MatriculasListUrlState['status']) {
  if (s === 'active') return 'Ativa';
  if (s === 'locked') return 'Trancada';
  if (s === 'cancelled') return 'Cancelada';
  return '';
}

export type MatriculasFilterBadgesProps = {
  state: MatriculasListUrlState;
  classGroupName?: string | null;
  studentName?: string | null;
  onClearClassGroup: () => void;
  onClearStudent: () => void;
  onClearStatus: () => void;
};

export function MatriculasFilterBadges({
  state,
  classGroupName,
  studentName,
  onClearClassGroup,
  onClearStudent,
  onClearStatus,
}: MatriculasFilterBadgesProps) {
  const items: Array<{ key: string; label: string; onRemove: () => void }> = [];

  if (state.classGroupId !== null) {
    const label =
      classGroupName && classGroupName.trim() !== ''
        ? `Turma: ${classGroupName}`
        : `Turma #${state.classGroupId}`;
    items.push({ key: 'cg', label, onRemove: onClearClassGroup });
  }
  if (state.studentPersonId !== null) {
    const label =
      studentName && studentName.trim() !== ''
        ? `Aluno: ${studentName}`
        : `Aluno #${state.studentPersonId}`;
    items.push({ key: 'st', label, onRemove: onClearStudent });
  }
  if (state.status !== '') {
    items.push({
      key: 'status',
      label: `Status: ${statusLabel(state.status)}`,
      onRemove: onClearStatus,
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {items.map((item) => (
        <Badge key={item.key} label={item.label} onRemove={item.onRemove} />
      ))}
    </div>
  );
}
