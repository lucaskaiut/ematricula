'use client';

import { format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X } from 'lucide-react';

import type { UsersListUrlState } from './users-url-state';

function parseLocalYmd(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isValid(d) ? d : null;
}

function formatRangeLabel(from: string, to: string) {
  const a = parseLocalYmd(from);
  const b = parseLocalYmd(to);
  if (!a || !b) return `${from} – ${to}`;
  return `${format(a, 'dd/MM/yyyy', { locale: ptBR })} – ${format(b, 'dd/MM/yyyy', { locale: ptBR })}`;
}

function Badge({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
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

export type UsersFilterBadgesProps = {
  state: UsersListUrlState;
  onClearName: () => void;
  onClearEmail: () => void;
  onClearCreatedRange: () => void;
  onClearUpdatedRange: () => void;
};

export function UsersFilterBadges({
  state,
  onClearName,
  onClearEmail,
  onClearCreatedRange,
  onClearUpdatedRange,
}: UsersFilterBadgesProps) {
  const items: Array<{ key: string; label: string; onRemove: () => void }> = [];

  if (state.name.trim()) {
    items.push({
      key: 'name',
      label: `Nome: ${state.name.trim()}`,
      onRemove: onClearName,
    });
  }
  if (state.email.trim()) {
    items.push({
      key: 'email',
      label: `E-mail: ${state.email.trim()}`,
      onRemove: onClearEmail,
    });
  }
  if (state.createdFrom && state.createdTo) {
    items.push({
      key: 'created',
      label: `Criado: ${formatRangeLabel(state.createdFrom, state.createdTo)}`,
      onRemove: onClearCreatedRange,
    });
  }
  if (state.updatedFrom && state.updatedTo) {
    items.push({
      key: 'updated',
      label: `Atualizado: ${formatRangeLabel(state.updatedFrom, state.updatedTo)}`,
      onRemove: onClearUpdatedRange,
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
