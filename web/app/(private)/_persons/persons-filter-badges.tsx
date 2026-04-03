'use client';

import { format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X } from 'lucide-react';

import type { PersonsListUrlState } from './persons-url-state';

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
    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-ematricula-text-primary shadow-sm">
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 rounded-full p-0.5 text-ematricula-text-muted transition-colors hover:bg-slate-100 hover:text-ematricula-text-primary"
        aria-label="Remover filtro"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </span>
  );
}

export type PersonsFilterBadgesProps = {
  state: PersonsListUrlState;
  modalityLookup?: ReadonlyMap<number, string>;
  onClearFullName: () => void;
  onClearEmail: () => void;
  onClearStatus: () => void;
  onClearGuardian: () => void;
  onClearModalities?: () => void;
  onClearCreatedRange: () => void;
  onClearUpdatedRange: () => void;
};

export function PersonsFilterBadges({
  state,
  modalityLookup,
  onClearFullName,
  onClearEmail,
  onClearStatus,
  onClearGuardian,
  onClearModalities,
  onClearCreatedRange,
  onClearUpdatedRange,
}: PersonsFilterBadgesProps) {
  const items: Array<{ key: string; label: string; onRemove: () => void }> = [];

  if (state.fullName.trim()) {
    items.push({
      key: 'fullName',
      label: `Nome: ${state.fullName.trim()}`,
      onRemove: onClearFullName,
    });
  }
  if (state.email.trim()) {
    items.push({
      key: 'email',
      label: `E-mail: ${state.email.trim()}`,
      onRemove: onClearEmail,
    });
  }
  if (state.status === 'active' || state.status === 'inactive') {
    items.push({
      key: 'status',
      label: `Status: ${state.status === 'active' ? 'Ativo' : 'Inativo'}`,
      onRemove: onClearStatus,
    });
  }
  if (state.guardianPersonId) {
    const name = state.guardianPersonName.trim();
    items.push({
      key: 'guardian',
      label: name ? `Responsável: ${name}` : `Responsável: #${state.guardianPersonId}`,
      onRemove: onClearGuardian,
    });
  }
  if (state.modalityIds.length > 0 && onClearModalities) {
    const names = state.modalityIds.map(
      (id) => modalityLookup?.get(id) ?? `#${id}`,
    );
    items.push({
      key: 'modalities',
      label:
        names.length <= 2
          ? `Modalidades: ${names.join(' e ')}`
          : `Modalidades: ${names.slice(0, 2).join(', ')} +${names.length - 2}`,
      onRemove: onClearModalities,
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
