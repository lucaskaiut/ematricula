'use client';

import { ListFilter, X } from 'lucide-react';
import { useCallback, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';

import type { EnrollmentStatus } from '@/types/api';

import type { MatriculasListUrlState } from './matriculas-url-state';

export type MatriculasFilterOption = { id: number; label: string };

export type MatriculasFiltersDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  committed: Pick<MatriculasListUrlState, 'classGroupId' | 'studentPersonId' | 'status'>;
  classGroupOptions: MatriculasFilterOption[];
  studentOptions: MatriculasFilterOption[];
  onApply: (
    next: Pick<MatriculasListUrlState, 'classGroupId' | 'studentPersonId' | 'status'>,
  ) => void;
};

const inputClass =
  'mt-1.5 w-full min-h-11 rounded-control border border-border bg-card px-3.5 py-2.5 text-sm text-foreground shadow-input outline-none transition-[box-shadow,border-color] focus:border-primary/55 focus:ring-2 focus:ring-primary/25';

const labelClass = 'text-sm font-medium text-secondary';

export function MatriculasFiltersDrawer({
  open,
  onOpenChange,
  committed,
  classGroupOptions,
  studentOptions,
  onApply,
}: MatriculasFiltersDrawerProps) {
  const titleId = useId();
  const [draftClassGroupId, setDraftClassGroupId] = useState<string>('');
  const [draftStudentId, setDraftStudentId] = useState<string>('');
  const [draftStatus, setDraftStatus] = useState<'' | EnrollmentStatus>('');

  useEffect(() => {
    if (!open) return;
    setDraftClassGroupId(
      committed.classGroupId !== null ? String(committed.classGroupId) : '',
    );
    setDraftStudentId(
      committed.studentPersonId !== null ? String(committed.studentPersonId) : '',
    );
    setDraftStatus(committed.status === '' ? '' : committed.status);
  }, [open, committed.classGroupId, committed.studentPersonId, committed.status]);

  const handleApply = useCallback(() => {
    const cg = draftClassGroupId === '' ? null : Number(draftClassGroupId);
    const st = draftStudentId === '' ? null : Number(draftStudentId);
    onApply({
      classGroupId: cg !== null && Number.isFinite(cg) && cg > 0 ? cg : null,
      studentPersonId: st !== null && Number.isFinite(st) && st > 0 ? st : null,
      status: draftStatus,
    });
    onOpenChange(false);
  }, [draftClassGroupId, draftStudentId, draftStatus, onApply, onOpenChange]);

  const handleClear = useCallback(() => {
    setDraftClassGroupId('');
    setDraftStudentId('');
    setDraftStatus('');
  }, []);

  const panel = open ? (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        aria-label="Fechar filtros"
        onClick={() => onOpenChange(false)}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <ListFilter className="h-4 w-4 text-muted" aria-hidden />
            <h2 id={titleId} className="text-sm font-semibold text-foreground">
              Filtros
            </h2>
          </div>
          <button
            type="button"
            className="rounded-control p-2 text-muted hover:bg-accent hover:text-foreground"
            aria-label="Fechar"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-5">
            <div>
              <label htmlFor="mf-class-group" className={labelClass}>
                Turma
              </label>
              <select
                id="mf-class-group"
                className={inputClass}
                value={draftClassGroupId}
                onChange={(e) => setDraftClassGroupId(e.target.value)}
              >
                <option value="">Todas</option>
                {classGroupOptions.map((o) => (
                  <option key={o.id} value={String(o.id)}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="mf-student" className={labelClass}>
                Aluno
              </label>
              <select
                id="mf-student"
                className={inputClass}
                value={draftStudentId}
                onChange={(e) => setDraftStudentId(e.target.value)}
              >
                <option value="">Todos</option>
                {studentOptions.map((o) => (
                  <option key={o.id} value={String(o.id)}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="mf-status" className={labelClass}>
                Status
              </label>
              <select
                id="mf-status"
                className={inputClass}
                value={draftStatus}
                onChange={(e) =>
                  setDraftStatus(e.target.value as '' | EnrollmentStatus)
                }
              >
                <option value="">Todos</option>
                <option value="active">Ativa</option>
                <option value="locked">Trancada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-control px-4 text-sm font-medium text-secondary ring-1 ring-border hover:bg-accent"
            onClick={handleClear}
          >
            Limpar
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-control bg-gradient-to-br from-primary to-primary-end px-5 text-sm font-semibold text-primary-foreground shadow-cta hover:opacity-95"
            onClick={handleApply}
          >
            Aplicar
          </button>
        </div>
      </aside>
    </div>
  ) : null;

  if (typeof document === 'undefined') return null;
  return createPortal(panel, document.body);
}
