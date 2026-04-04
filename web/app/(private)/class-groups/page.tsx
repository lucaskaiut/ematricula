'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { DataGrid } from '@/components/DataGrid';
import { Page } from '@/components/Page';
import { URL_ENCODED_STATE_KEY } from '@/lib/url-state';
import type { ApiResponse } from '@/lib/api';
import type { ClassGroupAttributes, ModalityAttributes, PersonAttributes } from '@/types/api';

import {
  classGroupsQueryKey,
  deleteClassGroup,
  listClassGroups,
} from './actions';
import { ClassGroupsFilterBadges } from './class-groups-filter-badges';
import { ClassGroupsFiltersDrawer } from './class-groups-filters-drawer';
import {
  buildClassGroupsListPath,
  classGroupsListStateToApiParams,
  hasClassGroupsListLegacyFlatParams,
  normalizeClassGroupsListUrlState,
  parseClassGroupsListUrlState,
  parseLegacyClassGroupsListUrlState,
  removeUpdatedParam,
  type ClassGroupsListUrlState,
} from './class-groups-url-state';

const WD_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatWeekdaysShort(s: string) {
  try {
    const arr = JSON.parse(s) as unknown;
    if (!Array.isArray(arr)) return '—';
    return arr
      .map((i) => WD_SHORT[Number(i)] ?? String(i))
      .join(', ');
  } catch {
    return '—';
  }
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

export default function ClassGroupsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const state = useMemo(
    () => parseClassGroupsListUrlState(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const listUpdated = searchParams.get('updated');

  useEffect(() => {
    if (searchParams.get(URL_ENCODED_STATE_KEY)) return;
    if (!hasClassGroupsListLegacyFlatParams(searchParams)) return;
    const legacyState = parseLegacyClassGroupsListUrlState(searchParams);
    const extra = new URLSearchParams();
    if (searchParams.get('updated') === '1') extra.set('updated', '1');
    router.replace(buildClassGroupsListPath(pathname, legacyState, extra));
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (listUpdated !== '1') return;
    void queryClient.invalidateQueries({ queryKey: ['class-groups'] });
    const next = removeUpdatedParam(searchParams);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [listUpdated, pathname, queryClient, router, searchParams]);

  const { data: modalitiesOptionsRes } = useQuery({
    queryKey: ['modalities', 'options', 'class-groups-list'],
    queryFn: async () => {
      const p = new URLSearchParams();
      p.set('per_page', '500');
      p.append('orderBy[name]', 'asc');
      const res = await fetch(`/api/modalities?${p}`);
      if (!res.ok) throw new Error('Falha ao carregar modalidades');
      return (await res.json()) as ApiResponse<ModalityAttributes[]>;
    },
  });

  const { data: teachersOptionsRes } = useQuery({
    queryKey: ['persons', 'teachers-options', 'class-groups-list'],
    queryFn: async () => {
      const p = new URLSearchParams();
      p.set('per_page', '500');
      p.set('filters[profile]', 'teacher');
      p.append('orderBy[full_name]', 'asc');
      const res = await fetch(`/api/persons?${p}`);
      if (!res.ok) throw new Error('Falha ao carregar professores');
      return (await res.json()) as ApiResponse<PersonAttributes[]>;
    },
  });

  const modalityOptions = modalitiesOptionsRes?.data ?? [];
  const teacherOptions = teachersOptionsRes?.data ?? [];

  const modalityLookup = useMemo(() => {
    const m = new Map<number, string>();
    for (const x of modalityOptions) m.set(x.id, x.name);
    return m;
  }, [modalityOptions]);

  const teacherLookup = useMemo(() => {
    const m = new Map<number, string>();
    for (const x of teacherOptions) m.set(x.id, x.full_name);
    return m;
  }, [teacherOptions]);

  const {
    data: response,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: classGroupsQueryKey({
      page: state.page,
      sort: state.sort,
      name: state.name.trim(),
      modalityId: state.modalityId,
      teacherPersonId: state.teacherPersonId,
    }),
    queryFn: async () =>
      listClassGroups({ searchParams: classGroupsListStateToApiParams(state) }),
    placeholderData: (prev) => prev,
  });

  const columns = useMemo(
    () => [
      { key: 'id', title: '#', priority: 0, sortable: true, width: 60 },
      { key: 'name', title: 'Nome', priority: 1, sortable: true, width: 200 },
      {
        key: 'modality',
        title: 'Modalidade',
        priority: 2,
        sortable: false,
        format: (_: unknown, row: ClassGroupAttributes) =>
          row.modality?.name ?? modalityLookup.get(row.modality_id) ?? '—',
        width: 160,
      },
      {
        key: 'teacher',
        title: 'Professor',
        priority: 3,
        sortable: false,
        format: (_: unknown, row: ClassGroupAttributes) =>
          row.teacher?.full_name ?? teacherLookup.get(row.teacher_person_id) ?? '—',
        width: 200,
      },
      {
        key: 'max_capacity',
        title: 'Capacidade',
        priority: 4,
        sortable: true,
        format: (value: unknown) =>
          value === null || value === undefined || value === '' ? '—' : String(value),
        width: 100,
      },
      {
        key: 'weekdays',
        title: 'Dias',
        priority: 5,
        sortable: false,
        format: (value: unknown) =>
          typeof value === 'string' ? formatWeekdaysShort(value) : '—',
        width: 180,
      },
      {
        key: 'starts_at',
        title: 'Início',
        priority: 6,
        sortable: true,
        width: 80,
      },
      {
        key: 'ends_at',
        title: 'Fim',
        priority: 7,
        sortable: true,
        width: 80,
      },
      {
        key: 'created_at',
        title: 'Criado em',
        priority: 8,
        sortable: true,
        format: (value: unknown) => formatDateTime(value),
        width: 140,
      },
    ],
    [modalityLookup, teacherLookup],
  );

  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);

  const replaceListState = useCallback(
    (next: ClassGroupsListUrlState) => {
      const normalized = normalizeClassGroupsListUrlState(next);
      const extra = new URLSearchParams();
      if (searchParams.get('updated') === '1') extra.set('updated', '1');
      router.replace(buildClassGroupsListPath(pathname, normalized, extra));
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
    (patch: Pick<ClassGroupsListUrlState, 'modalityId' | 'teacherPersonId'>) => {
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
    mutationFn: async (row: ClassGroupAttributes) => deleteClassGroup({ id: row.id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['class-groups'] });
    },
  });

  const handleDelete = useCallback(
    (row: ClassGroupAttributes) => {
      if (deleteMutation.isPending) return;
      const ok = window.confirm(`Excluir a turma "${row.name}"?`);
      if (!ok) return;
      deleteMutation.mutate(row);
    },
    [deleteMutation],
  );

  const handleEdit = useCallback(
    (row: ClassGroupAttributes) => {
      router.push(`/class-groups/${row.id}/edit`);
    },
    [router],
  );

  const [searchDraft, setSearchDraft] = useState(state.name);

  useEffect(() => {
    const id = requestAnimationFrame(() => setSearchDraft(state.name));
    return () => cancelAnimationFrame(id);
  }, [state.name]);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchDraft(value);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        const trimmed = value.trim();
        replaceListState({
          ...stateRef.current,
          name: trimmed,
          page: 1,
        });
      }, 300);
    },
    [replaceListState],
  );

  return (
    <Page.Root>
      <Page.Header title="Turmas" href="/class-groups/new">
        Nova turma
      </Page.Header>

      <ClassGroupsFiltersDrawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        committed={{
          modalityId: state.modalityId,
          teacherPersonId: state.teacherPersonId,
        }}
        modalities={modalityOptions}
        teachers={teacherOptions}
        onApply={handleApplyDrawerFilters}
      />

      <Page.Filters>
        <Page.FiltersControls>
          <Page.FiltersSearch
            value={searchDraft}
            onChange={handleSearchChange}
            name="class-group-name-filter"
            autoComplete="off"
            placeholder="Pesquisar por nome…"
            aria-label="Pesquisar turma por nome"
          />
          <ClassGroupsFilterBadges
            state={state}
            modalityLabel={
              state.modalityId !== null ? modalityLookup.get(state.modalityId) : undefined
            }
            teacherLabel={
              state.teacherPersonId !== null
                ? teacherLookup.get(state.teacherPersonId)
                : undefined
            }
            onClearName={() =>
              replaceListState({
                ...stateRef.current,
                name: '',
                page: 1,
              })
            }
            onClearModality={() =>
              replaceListState({
                ...stateRef.current,
                modalityId: null,
                page: 1,
              })
            }
            onClearTeacher={() =>
              replaceListState({
                ...stateRef.current,
                teacherPersonId: null,
                page: 1,
              })
            }
          />
        </Page.FiltersControls>
        <Page.FiltersDrawerTrigger onClick={() => setFiltersOpen(true)} />
      </Page.Filters>

      <Page.List>
        <DataGrid.Table<ClassGroupAttributes>
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
