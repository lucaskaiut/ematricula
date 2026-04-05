'use client';

import type { PlanosListUrlState } from './planos-url-state';

type Props = {
  state: PlanosListUrlState;
  onClearName: () => void;
};

export function PlanosFilterBadges({ state, onClearName }: Props) {
  const name = state.name.trim();
  if (!name) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onClearName}
        className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-secondary ring-1 ring-border transition-colors hover:bg-accent/80"
      >
        <span className="truncate">Nome: {name}</span>
        <span className="text-muted" aria-hidden>
          ×
        </span>
      </button>
    </div>
  );
}
