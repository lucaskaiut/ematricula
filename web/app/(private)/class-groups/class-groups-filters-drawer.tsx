'use client';

import { ListFilter, X } from 'lucide-react';
import { useCallback, useEffect, useId, useState } from 'react';

import type { ModalityAttributes, PersonAttributes } from '@/types/api';

import type { ClassGroupsListUrlState } from './class-groups-url-state';

const labelClass = 'text-sm font-medium text-secondary';

const selectClass =
  'mt-1.5 w-full min-h-11 rounded-control border border-border bg-card px-3.5 py-2.5 text-sm text-foreground shadow-input outline-none focus:border-primary/55 focus:ring-2 focus:ring-primary/25';

export type ClassGroupsFiltersDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  committed: Pick<ClassGroupsListUrlState, 'modalityId' | 'teacherPersonId'>;
  modalities: ModalityAttributes[];
  teachers: PersonAttributes[];
  onApply: (next: Pick<ClassGroupsListUrlState, 'modalityId' | 'teacherPersonId'>) => void;
};

export function ClassGroupsFiltersDrawer({
  open,
  onOpenChange,
  committed,
  modalities,
  teachers,
  onApply,
}: ClassGroupsFiltersDrawerProps) {
  const titleId = useId();
  const [modalityId, setModalityId] = useState<string>(
    committed.modalityId !== null ? String(committed.modalityId) : '',
  );
  const [teacherPersonId, setTeacherPersonId] = useState<string>(
    committed.teacherPersonId !== null ? String(committed.teacherPersonId) : '',
  );

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      setModalityId(committed.modalityId !== null ? String(committed.modalityId) : '');
      setTeacherPersonId(
        committed.teacherPersonId !== null ? String(committed.teacherPersonId) : '',
      );
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
    const mid = modalityId === '' ? null : Math.trunc(Number(modalityId));
    const tid = teacherPersonId === '' ? null : Math.trunc(Number(teacherPersonId));
    onApply({
      modalityId:
        mid !== null && Number.isFinite(mid) && mid > 0 ? mid : null,
      teacherPersonId:
        tid !== null && Number.isFinite(tid) && tid > 0 ? tid : null,
    });
    onOpenChange(false);
  }, [modalityId, teacherPersonId, onApply, onOpenChange]);

  const handleClearAll = useCallback(() => {
    setModalityId('');
    setTeacherPersonId('');
    onApply({ modalityId: null, teacherPersonId: null });
    onOpenChange(false);
  }, [onApply, onOpenChange]);

  if (!open) return null;

  const modalitySorted = [...modalities].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR'),
  );
  const teachersSorted = [...teachers].sort((a, b) =>
    a.full_name.localeCompare(b.full_name, 'pt-BR'),
  );

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
            <ListFilter className="h-5 w-5 text-muted" aria-hidden />
            <h2 id={titleId} className="text-lg font-semibold text-foreground">
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

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-4 py-5">
          <div>
            <label htmlFor="filter-class-group-modality" className={labelClass}>
              Modalidade
            </label>
            <select
              id="filter-class-group-modality"
              className={selectClass}
              value={modalityId}
              onChange={(e) => setModalityId(e.target.value)}
            >
              <option value="">Todas</option>
              {modalitySorted.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-class-group-teacher" className={labelClass}>
              Professor
            </label>
            <select
              id="filter-class-group-teacher"
              className={selectClass}
              value={teacherPersonId}
              onChange={(e) => setTeacherPersonId(e.target.value)}
            >
              <option value="">Todos</option>
              {teachersSorted.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </div>
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
