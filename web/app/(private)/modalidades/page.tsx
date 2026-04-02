'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ListFilter } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { URL_ENCODED_STATE_KEY } from '@/lib/url-state';
import type { ModalityAttributes } from '@/types/api';
import { DataGrid } from '@/components/DataGrid';
import { deleteModality, listModalities, modalitiesQueryKey } from './actions';
import { ModalitiesFilterBadges } from './modalidades-filter-badges';
import { ModalitiesFiltersDrawer } from './modalidades-filters-drawer';
import {
  buildModalitiesListPath,
  hasModalitiesListLegacyFlatParams,
  normalizeModalitiesListUrlState,
  parseLegacyModalitiesListUrlState,
  parseModalitiesListUrlState,
  modalitiesListStateToApiParams,
  removeUpdatedParam,
  type ModalitiesListUrlState,
} from './modalidades-url-state';

function formatDateTime(value: unknown) {
  if (typeof value !== 'string' || !value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

function truncateDescription(value: unknown, max = 80) {
  if (typeof value !== 'string' || !value) return '—';
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}

export default function ModalidadesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const state = useMemo(
    () => parseModalitiesListUrlState(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const listUpdated = searchParams.get('updated');

  useEffect(() => {
    if (searchParams.get(URL_ENCODED_STATE_KEY)) return;
    if (!hasModalitiesListLegacyFlatParams(searchParams)) return;
    const legacyState = parseLegacyModalitiesListUrlState(searchParams);
    const extra = new URLSearchParams();
    if (searchParams.get('updated') === '1') extra.set('updated', '1');
    router.replace(buildModalitiesListPath(pathname, legacyState, extra));
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (listUpdated !== '1') return;
    void queryClient.invalidateQueries({ queryKey: ['modalities'] });
    const next = removeUpdatedParam(searchParams);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [listUpdated, pathname, queryClient, router, searchParams]);

  const {
    data: response,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: modalitiesQueryKey({
      page: state.page,
      sort: state.sort,
      name: state.name.trim(),
      description: state.description.trim(),
      createdFrom: state.createdFrom,
      createdTo: state.createdTo,
      updatedFrom: state.updatedFrom,
      updatedTo: state.updatedTo,
    }),
    queryFn: async () =>
      listModalities({ searchParams: modalitiesListStateToApiParams(state) }),
    placeholderData: (prev) => prev,
  });

  const columns = useMemo(
    () => [
      { key: 'id', title: '#', priority: 0, sortable: true, width: 60 },
      { key: 'name', title: 'Nome', priority: 1, sortable: true, width: 220 },
      {
        key: 'description',
        title: 'Descrição',
        priority: 2,
        sortable: true,
        format: (value: unknown) => truncateDescription(value),
        width: 320,
      },
      {
        key: 'created_at',
        title: 'Criado em',
        priority: 3,
        sortable: true,
        format: (value: unknown) => formatDateTime(value),
        width: 160,
      },
      {
        key: 'updated_at',
        title: 'Atualizado em',
        priority: 4,
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
    (next: ModalitiesListUrlState) => {
      const normalized = normalizeModalitiesListUrlState(next);
      const extra = new URLSearchParams();
      if (searchParams.get('updated') === '1') extra.set('updated', '1');
      router.replace(buildModalitiesListPath(pathname, normalized, extra));
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
        ModalitiesListUrlState,
        'description' | 'createdFrom' | 'createdTo' | 'updatedFrom' | 'updatedTo'
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
    mutationFn: async (row: ModalityAttributes) => deleteModality({ id: row.id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['modalities'] });
    },
  });

  const handleDelete = useCallback(
    (row: ModalityAttributes) => {
      if (deleteMutation.isPending) return;
      const ok = window.confirm(`Excluir a modalidade "${row.name}"?`);
      if (!ok) return;
      deleteMutation.mutate(row);
    },
    [deleteMutation],
  );

  const handleEdit = useCallback(
    (row: ModalityAttributes) => {
      router.push(`/modalidades/${row.id}/edit`);
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
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-ematricula-text-primary text-xl font-semibold tracking-tight sm:text-2xl">
          Modalidades
        </h1>
        <Link
          href="/modalidades/new"
          className="inline-flex min-h-11 items-center justify-center rounded-(--ematricula-radius-control) bg-linear-to-br from-(--ematricula-cta-gradient-from) to-(--ematricula-cta-gradient-to) px-4 text-sm font-semibold text-white shadow-(--shadow-ematricula-cta) transition-opacity hover:opacity-95 sm:min-h-10"
        >
          Nova modalidade
        </Link>
      </div>

      <ModalitiesFiltersDrawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        committed={{
          description: state.description,
          createdFrom: state.createdFrom,
          createdTo: state.createdTo,
          updatedFrom: state.updatedFrom,
          updatedTo: state.updatedTo,
        }}
        onApply={handleApplyDrawerFilters}
      />

      <div className="bg-ematricula-surface flex w-full shrink-0 flex-col gap-3 rounded-(--ematricula-radius-control) p-2 sm:flex-row sm:items-center sm:justify-between sm:p-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <input
              value={searchDraft}
              onChange={handleSearchChange}
              className="border-ematricula-border-input text-ematricula-text-primary placeholder:text-ematricula-text-placeholder min-h-11 w-full max-w-md min-w-[min(100%,12rem)] shrink-0 rounded-(--ematricula-radius-control) border bg-white px-3.5 py-2 text-sm outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/25 sm:w-auto sm:min-w-[14rem] sm:flex-1"
              type="search"
              name="modality-name-filter"
              autoComplete="off"
              placeholder="Pesquisar por nome…"
              aria-label="Pesquisar modalidade por nome"
            />
            <ModalitiesFilterBadges
              state={state}
              onClearName={() =>
                replaceListState({
                  ...stateRef.current,
                  name: '',
                  page: 1,
                })
              }
              onClearDescription={() =>
                replaceListState({
                  ...stateRef.current,
                  description: '',
                  page: 1,
                })
              }
              onClearCreatedRange={() =>
                replaceListState({
                  ...stateRef.current,
                  createdFrom: '',
                  createdTo: '',
                  page: 1,
                })
              }
              onClearUpdatedRange={() =>
                replaceListState({
                  ...stateRef.current,
                  updatedFrom: '',
                  updatedTo: '',
                  page: 1,
                })
              }
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="text-ematricula-text-primary inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-(--ematricula-radius-control) border border-slate-200 bg-white px-4 text-sm font-medium shadow-sm transition-colors hover:bg-slate-50 sm:min-h-10"
        >
          <ListFilter
            className="text-ematricula-text-muted h-4 w-4"
            aria-hidden
          />
          Filtros
        </button>
      </div>

      <DataGrid.Root
        className="min-h-0"
        maxHeightClassName="max-h-[calc(100dvh-18rem)]"
      >
        <DataGrid.Table<ModalityAttributes>
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
      </DataGrid.Root>
    </div>
  );
}
