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
import { formatCurrencyBrl } from '@/lib/currency-brl';
import { URL_ENCODED_STATE_KEY } from '@/lib/url-state';
import type { PlanAttributes } from '@/types/api';

import { deletePlan, listPlans, planosQueryKey } from './actions';
import { PlanosFilterBadges } from './planos-filter-badges';
import {
  buildPlanosListPath,
  hasPlanosListLegacyFlatParams,
  normalizePlanosListUrlState,
  parseLegacyPlanosListUrlState,
  parsePlanosListUrlState,
  planosListStateToApiParams,
  removeUpdatedParam,
  type PlanosListUrlState,
} from './planos-url-state';

function formatDateTime(value: unknown) {
  if (typeof value !== 'string' || !value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

function cycleLabel(cycle: string, interval: number) {
  if (cycle === 'year') {
    return interval === 1 ? 'Anual' : `A cada ${interval} ano(s)`;
  }
  return interval === 1 ? 'Mensal' : `A cada ${interval} mês(es)`;
}

export default function PlanosPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const state = useMemo(
    () => parsePlanosListUrlState(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const listUpdated = searchParams.get('updated');

  useEffect(() => {
    if (searchParams.get(URL_ENCODED_STATE_KEY)) return;
    if (!hasPlanosListLegacyFlatParams(searchParams)) return;
    const legacyState = parseLegacyPlanosListUrlState(searchParams);
    const extra = new URLSearchParams();
    if (searchParams.get('updated') === '1') extra.set('updated', '1');
    router.replace(buildPlanosListPath(pathname, legacyState, extra));
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (listUpdated !== '1') return;
    void queryClient.invalidateQueries({ queryKey: ['plans'] });
    const next = removeUpdatedParam(searchParams);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [listUpdated, pathname, queryClient, router, searchParams]);

  const apiParams = useMemo(() => {
    const p = planosListStateToApiParams(state);
    p.set('per_page', '15');
    return p;
  }, [state]);

  const {
    data: response,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: planosQueryKey({
      page: state.page,
      sort: state.sort,
      name: state.name.trim(),
    }),
    queryFn: async () => listPlans({ searchParams: apiParams }),
    placeholderData: (prev) => prev,
  });

  const columns = useMemo(
    () => [
      { key: 'id', title: '#', priority: 0, sortable: true, width: 60 },
      { key: 'name', title: 'Nome', priority: 1, sortable: true, width: 220 },
      {
        key: 'price',
        title: 'Valor',
        priority: 2,
        sortable: true,
        width: 120,
        format: (value: unknown) => formatCurrencyBrl(value as string | number | null),
      },
      {
        key: 'billing_cycle',
        title: 'Periodicidade',
        priority: 3,
        sortable: false,
        width: 160,
        format: (_v: unknown, row: PlanAttributes) =>
          cycleLabel(row.billing_cycle, row.billing_interval),
      },
      {
        key: 'created_at',
        title: 'Criado em',
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
    (next: PlanosListUrlState) => {
      const normalized = normalizePlanosListUrlState(next);
      const extra = new URLSearchParams();
      if (searchParams.get('updated') === '1') extra.set('updated', '1');
      router.replace(buildPlanosListPath(pathname, normalized, extra));
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

  const loading = isLoading || isFetching;

  const deleteMutation = useMutation({
    mutationFn: async (row: PlanAttributes) => deletePlan({ id: row.id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });

  const handleDelete = useCallback(
    (row: PlanAttributes) => {
      if (deleteMutation.isPending) return;
      const ok = window.confirm(`Excluir o plano "${row.name}"?`);
      if (!ok) return;
      deleteMutation.mutate(row);
    },
    [deleteMutation],
  );

  const handleEdit = useCallback(
    (row: PlanAttributes) => {
      router.push(`/planos/${row.id}/edit`);
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
      <Page.Header title="Planos" href="/planos/new">
        Novo plano
      </Page.Header>

      <Page.Filters>
        <Page.FiltersControls>
          <Page.FiltersSearch
            value={searchDraft}
            onChange={handleSearchChange}
            name="plan-name-filter"
            autoComplete="off"
            placeholder="Pesquisar por nome…"
            aria-label="Pesquisar plano por nome"
          />
          <PlanosFilterBadges
            state={state}
            onClearName={() =>
              replaceListState({
                ...stateRef.current,
                name: '',
                page: 1,
              })
            }
          />
        </Page.FiltersControls>
      </Page.Filters>

      <Page.List>
        <DataGrid.Table<PlanAttributes>
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
              per_page: 15,
            }
          }
          onPageChange={handlePageChange}
          disabled={loading}
        />
      </Page.List>
    </Page.Root>
  );
}
