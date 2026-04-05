'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { DataGrid } from '@/components/DataGrid';
import { Page } from '@/components/Page';
import { URL_ENCODED_STATE_KEY } from '@/lib/url-state';
import type { ApiResponse } from '@/lib/api';
import type { ClassGroupAttributes, EnrollmentAttributes, PersonAttributes } from '@/types/api';

import {
  deleteEnrollment,
  enrollmentsQueryKey,
  listEnrollments,
} from './actions';
import { MatriculasFilterBadges } from './matriculas-filter-badges';
import { MatriculasFiltersDrawer } from './matriculas-filters-drawer';
import {
  buildMatriculasListPath,
  hasMatriculasListLegacyFlatParams,
  matriculasListStateToApiParams,
  normalizeMatriculasListUrlState,
  parseLegacyMatriculasListUrlState,
  parseMatriculasListUrlState,
  removeUpdatedParam,
  type MatriculasListUrlState,
} from './matriculas-url-state';

function formatDateOnly(value: unknown) {
  if (typeof value !== 'string' || !value) return '—';
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(d);
}

function formatDateTime(value: unknown) {
  if (typeof value !== 'string' || !value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

function statusPt(s: string) {
  if (s === 'active') return 'Ativa';
  if (s === 'locked') return 'Trancada';
  if (s === 'cancelled') return 'Cancelada';
  return s;
}

function EnrollmentStatusBadge({ status }: { status: EnrollmentAttributes['status'] }) {
  const label = statusPt(status);
  const className =
    status === 'active'
      ? 'bg-emerald-500/15 text-emerald-900 ring-emerald-600/30 dark:text-emerald-200 dark:ring-emerald-500/35'
      : status === 'locked'
        ? 'bg-amber-400/20 text-amber-950 ring-amber-600/35 dark:bg-amber-500/15 dark:text-amber-100 dark:ring-amber-500/40'
        : status === 'cancelled'
          ? 'bg-red-500/15 text-red-900 ring-red-600/30 dark:text-red-200 dark:ring-red-500/35'
          : 'bg-muted text-secondary ring-border';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${className}`}
    >
      {label}
    </span>
  );
}

export default function MatriculasPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const state = useMemo(
    () => parseMatriculasListUrlState(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const listUpdated = searchParams.get('updated');

  useEffect(() => {
    if (searchParams.get(URL_ENCODED_STATE_KEY)) return;
    if (!hasMatriculasListLegacyFlatParams(searchParams)) return;
    const legacyState = parseLegacyMatriculasListUrlState(searchParams);
    const extra = new URLSearchParams();
    if (searchParams.get('updated') === '1') extra.set('updated', '1');
    router.replace(buildMatriculasListPath(pathname, legacyState, extra));
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (listUpdated !== '1') return;
    void queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    const next = removeUpdatedParam(searchParams);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [listUpdated, pathname, queryClient, router, searchParams]);

  const { data: classGroupsOptionsRes } = useQuery({
    queryKey: ['class-groups', 'options', 'matriculas-list'],
    queryFn: async () => {
      const p = new URLSearchParams();
      p.set('per_page', '500');
      p.append('orderBy[name]', 'asc');
      const res = await fetch(`/api/class-groups?${p}`);
      if (!res.ok) throw new Error('Falha ao carregar turmas');
      return (await res.json()) as ApiResponse<ClassGroupAttributes[]>;
    },
  });

  const { data: studentsOptionsRes } = useQuery({
    queryKey: ['persons', 'students-options', 'matriculas-list'],
    queryFn: async () => {
      const p = new URLSearchParams();
      p.set('per_page', '500');
      p.set('filters[profile]', 'student');
      p.append('orderBy[full_name]', 'asc');
      const res = await fetch(`/api/persons?${p}`);
      if (!res.ok) throw new Error('Falha ao carregar alunos');
      return (await res.json()) as ApiResponse<PersonAttributes[]>;
    },
  });

  const classGroupOptionsForDrawer = useMemo(
    () =>
      [...(classGroupsOptionsRes?.data ?? [])]
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
        .map((g) => ({ id: g.id, label: g.name })),
    [classGroupsOptionsRes?.data],
  );

  const studentOptionsForDrawer = useMemo(
    () =>
      [...(studentsOptionsRes?.data ?? [])]
        .sort((a, b) => a.full_name.localeCompare(b.full_name, 'pt-BR'))
        .map((p) => ({ id: p.id, label: p.full_name })),
    [studentsOptionsRes?.data],
  );

  const badgeClassGroupName = useMemo(() => {
    if (state.classGroupId === null) return null;
    const g = classGroupsOptionsRes?.data?.find((x) => x.id === state.classGroupId);
    return g?.name ?? null;
  }, [classGroupsOptionsRes?.data, state.classGroupId]);

  const badgeStudentName = useMemo(() => {
    if (state.studentPersonId === null) return null;
    const p = studentsOptionsRes?.data?.find((x) => x.id === state.studentPersonId);
    return p?.full_name ?? null;
  }, [studentsOptionsRes?.data, state.studentPersonId]);

  const {
    data: response,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: enrollmentsQueryKey({
      page: state.page,
      sort: state.sort,
      classGroupId: state.classGroupId,
      studentPersonId: state.studentPersonId,
      status: state.status,
    }),
    queryFn: async () =>
      listEnrollments({ searchParams: matriculasListStateToApiParams(state) }),
    placeholderData: (prev) => prev,
  });

  const columns = useMemo(
    () => [
      { key: 'id', title: '#', priority: 0, sortable: true, width: 60 },
      {
        key: 'student_person_id',
        title: 'Aluno',
        priority: 1,
        sortable: true,
        width: 200,
        format: (_v: unknown, row: EnrollmentAttributes) =>
          row.student?.full_name ?? `— (#${row.student_person_id})`,
      },
      {
        key: 'class_group_id',
        title: 'Turma',
        priority: 2,
        sortable: true,
        width: 200,
        format: (_v: unknown, row: EnrollmentAttributes) =>
          row.class_group?.name ?? `— (#${row.class_group_id})`,
      },
      {
        key: 'plan_id',
        title: 'Plano',
        priority: 2.4,
        sortable: false,
        width: 180,
        format: (_v: unknown, row: EnrollmentAttributes) =>
          row.active_subscription?.plan?.name ??
          (row.active_subscription ? `Plano #${row.active_subscription.plan_id}` : '—'),
      },
      {
        key: 'starts_on',
        title: 'Início',
        priority: 3,
        sortable: true,
        width: 120,
        format: (value: unknown) => formatDateOnly(value),
      },
      {
        key: 'ends_on',
        title: 'Término',
        priority: 4,
        sortable: true,
        width: 120,
        format: (value: unknown) => formatDateOnly(value),
      },
      {
        key: 'status',
        title: 'Status',
        priority: 5,
        sortable: true,
        width: 132,
        render: (row: EnrollmentAttributes) => <EnrollmentStatusBadge status={row.status} />,
      },
      {
        key: 'created_at',
        title: 'Criado em',
        priority: 6,
        sortable: true,
        format: (value: unknown) => formatDateTime(value),
        width: 160,
      },
    ],
    [],
  );

  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);

  const replaceListState = useCallback(
    (next: MatriculasListUrlState) => {
      const normalized = normalizeMatriculasListUrlState(next);
      const extra = new URLSearchParams();
      if (searchParams.get('updated') === '1') extra.set('updated', '1');
      router.replace(buildMatriculasListPath(pathname, normalized, extra));
    },
    [pathname, router, searchParams],
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      replaceListState({ ...stateRef.current, page: nextPage });
    },
    [replaceListState],
  );

  const handleSortChange = useCallback(
    (next: Array<{ key: string; direction: 'asc' | 'desc' }>) => {
      replaceListState({
        ...stateRef.current,
        sort: next,
        page: 1,
      });
    },
    [replaceListState],
  );

  const handleApplyDrawerFilters = useCallback(
    (
      patch: Pick<
        MatriculasListUrlState,
        'classGroupId' | 'studentPersonId' | 'status'
      >,
    ) => {
      replaceListState({
        ...stateRef.current,
        ...patch,
        page: 1,
      });
    },
    [replaceListState],
  );

  const loading = isLoading || isFetching;

  const deleteMutation = useMutation({
    mutationFn: async (row: EnrollmentAttributes) => deleteEnrollment({ id: row.id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });

  const handleDelete = useCallback(
    (row: EnrollmentAttributes) => {
      if (deleteMutation.isPending) return;
      const name = row.student?.full_name ?? `matrícula #${row.id}`;
      const ok = window.confirm(`Excluir a matrícula de "${name}"?`);
      if (!ok) return;
      deleteMutation.mutate(row);
    },
    [deleteMutation],
  );

  const handleEdit = useCallback(
    (row: EnrollmentAttributes) => {
      router.push(`/matriculas/${row.id}/edit`);
    },
    [router],
  );

  return (
    <Page.Root>
      <Page.Header title="Matrículas" href="/matriculas/new">
        Nova matrícula
      </Page.Header>

      <MatriculasFiltersDrawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        committed={{
          classGroupId: state.classGroupId,
          studentPersonId: state.studentPersonId,
          status: state.status,
        }}
        classGroupOptions={classGroupOptionsForDrawer}
        studentOptions={studentOptionsForDrawer}
        onApply={handleApplyDrawerFilters}
      />

      <Page.Filters>
        <Page.FiltersControls>
          <MatriculasFilterBadges
            state={state}
            classGroupName={badgeClassGroupName}
            studentName={badgeStudentName}
            onClearClassGroup={() =>
              replaceListState({
                ...stateRef.current,
                classGroupId: null,
                page: 1,
              })
            }
            onClearStudent={() =>
              replaceListState({
                ...stateRef.current,
                studentPersonId: null,
                page: 1,
              })
            }
            onClearStatus={() =>
              replaceListState({
                ...stateRef.current,
                status: '',
                page: 1,
              })
            }
          />
        </Page.FiltersControls>
        <Page.FiltersDrawerTrigger onClick={() => setFiltersOpen(true)} />
      </Page.Filters>

      <Page.List>
        <DataGrid.Table<EnrollmentAttributes>
          data={response?.data ?? []}
          columns={columns}
          sort={state.sort}
          onSortChange={handleSortChange}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        <DataGrid.Pagination
          meta={
            response?.meta ?? {
              total: 0,
              current_page: 1,
              from: 0,
              to: 0,
              last_page: 1,
              path: '',
              per_page: 10,
            }
          }
          onPageChange={handlePageChange}
          disabled={loading}
        />
      </Page.List>
    </Page.Root>
  );
}
