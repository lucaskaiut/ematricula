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
import type { ReactNode } from 'react';
import { URL_ENCODED_STATE_KEY } from '@/lib/url-state';
import type { PersonAttributes, PersonProfile } from '@/types/api';
import { DataGrid } from '@/components/DataGrid';
import { Page } from '@/components/Page';
import { deletePerson, listModalitiesOptions, listPersons, personsQueryKey } from './actions';
import { PersonsFilterBadges } from './persons-filter-badges';
import { PersonsFiltersDrawer } from './persons-filters-drawer';
import {
  buildPersonsListPath,
  hasPersonsListLegacyFlatParams,
  normalizePersonsListUrlState,
  parseLegacyPersonsListUrlState,
  parsePersonsListUrlState,
  personsListStateToApiParams,
  removeUpdatedParam,
  type PersonsListUrlState,
} from './persons-url-state';

function formatDate(value: unknown) {
  if (typeof value !== 'string' || !value) return '—';
  const d = new Date(value);
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

function statusLabel(s: string) {
  if (s === 'active') return 'Ativo';
  if (s === 'inactive') return 'Inativo';
  return s;
}

export type PersonsListPageProps = {
  profile: PersonProfile;
  basePath: string;
  title: string;
  newHref: string;
  searchPlaceholder: string;
  enableGuardianFilter?: boolean;
  enableModalityFilter?: boolean;
};

export function PersonsListPage({
  profile,
  basePath,
  title,
  newHref,
  searchPlaceholder,
  enableGuardianFilter = false,
  enableModalityFilter = false,
}: PersonsListPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const personsState = useMemo(
    () => parsePersonsListUrlState(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const listUpdated = searchParams.get('updated');

  const filtersCommitted = useMemo(
    () => ({
      email: personsState.email,
      status: personsState.status,
      guardianPersonId: personsState.guardianPersonId,
      guardianPersonName: personsState.guardianPersonName,
      modalityIds: personsState.modalityIds,
      createdFrom: personsState.createdFrom,
      createdTo: personsState.createdTo,
      updatedFrom: personsState.updatedFrom,
      updatedTo: personsState.updatedTo,
    }),
    [
      personsState.email,
      personsState.status,
      personsState.guardianPersonId,
      personsState.guardianPersonName,
      personsState.modalityIds,
      personsState.createdFrom,
      personsState.createdTo,
      personsState.updatedFrom,
      personsState.updatedTo,
    ],
  );

  const { data: modalitiesLookupRes } = useQuery({
    queryKey: ['modalities', 'list-lookup'],
    queryFn: () => listModalitiesOptions(),
    enabled: enableModalityFilter,
  });

  const modalityLookup = useMemo(() => {
    const map = new Map<number, string>();
    for (const m of modalitiesLookupRes?.data ?? []) {
      map.set(m.id, m.name);
    }
    return map;
  }, [modalitiesLookupRes?.data]);

  useEffect(() => {
    if (searchParams.get(URL_ENCODED_STATE_KEY)) return;
    if (!hasPersonsListLegacyFlatParams(searchParams)) return;
    const legacyState = parseLegacyPersonsListUrlState(searchParams);
    const extra = new URLSearchParams();
    if (searchParams.get('updated') === '1') extra.set('updated', '1');
    router.replace(buildPersonsListPath(pathname, legacyState, extra));
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (listUpdated !== '1') return;
    void queryClient.invalidateQueries({ queryKey: ['persons'] });
    const next = removeUpdatedParam(searchParams);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [listUpdated, pathname, queryClient, router, searchParams]);

  const {
    data: response,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: personsQueryKey({
      profile,
      page: personsState.page,
      sort: personsState.sort,
      fullName: personsState.fullName.trim(),
      email: personsState.email.trim(),
      status: personsState.status,
      guardianPersonId:
        profile === 'student' ? personsState.guardianPersonId : '',
      modalityIds:
        profile === 'teacher' ? [...personsState.modalityIds].sort((a, b) => a - b) : [],
      createdFrom: personsState.createdFrom,
      createdTo: personsState.createdTo,
      updatedFrom: personsState.updatedFrom,
      updatedTo: personsState.updatedTo,
    }),
    queryFn: async () =>
      listPersons({
        profile,
        searchParams: personsListStateToApiParams(personsState, profile),
      }),
    placeholderData: (prev) => prev,
  });

  const columns = useMemo(() => {
    const base: Array<{
      key: string;
      title: string;
      priority: number;
      sortable: boolean;
      width: number;
      format?: (value: unknown, row: PersonAttributes) => ReactNode;
    }> = [
      { key: 'id', title: '#', priority: 0, sortable: true, width: 60 },
      {
        key: 'full_name',
        title: 'Nome',
        priority: 1,
        sortable: true,
        width: 280,
      },
      {
        key: 'email',
        title: 'E-mail',
        priority: 2,
        sortable: true,
        width: 240,
      },
      {
        key: 'birth_date',
        title: 'Nascimento',
        priority: 3,
        sortable: true,
        format: (value: unknown) => formatDate(value),
        width: 120,
      },
      {
        key: 'phone',
        title: 'Telefone',
        priority: 4,
        sortable: false,
        width: 130,
      },
      {
        key: 'status',
        title: 'Status',
        priority: 5,
        sortable: true,
        format: (value: unknown) =>
          typeof value === 'string' ? statusLabel(value) : '—',
        width: 100,
      },
    ];
    if (profile === 'teacher') {
      base.push({
        key: 'modalities',
        title: 'Modalidades',
        priority: 6,
        sortable: false,
        width: 220,
        format: (_v, row) => {
          const mod = row.modalities;
          if (!Array.isArray(mod) || mod.length === 0) return '—';
          return mod.map((m) => m.name).join(', ');
        },
      });
    }
    base.push({
      key: 'created_at',
      title: 'Criado em',
      priority: 7,
      sortable: true,
      format: (value: unknown) => formatDateTime(value),
      width: 160,
    });
    return base;
  }, [profile]);

  const personsStateRef = useRef(personsState);
  useLayoutEffect(() => {
    personsStateRef.current = personsState;
  }, [personsState]);

  const replaceListState = useCallback(
    (next: PersonsListUrlState) => {
      const normalized = normalizePersonsListUrlState(next);
      const extra = new URLSearchParams();
      if (searchParams.get('updated') === '1') extra.set('updated', '1');
      router.replace(buildPersonsListPath(pathname, normalized, extra));
    },
    [pathname, router, searchParams],
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      replaceListState({ ...personsStateRef.current, page: nextPage });
    },
    [replaceListState],
  );

  const handleSortChange = useCallback(
    (next: Array<{ key: string; direction: 'asc' | 'desc' }>) => {
      replaceListState({
        ...personsStateRef.current,
        sort: next,
        page: 1,
      });
    },
    [replaceListState],
  );

  const handleApplyDrawerFilters = useCallback(
    (
      patch: Pick<
        PersonsListUrlState,
        | 'email'
        | 'status'
        | 'guardianPersonId'
        | 'guardianPersonName'
        | 'modalityIds'
        | 'createdFrom'
        | 'createdTo'
        | 'updatedFrom'
        | 'updatedTo'
      >,
    ) => {
      replaceListState({
        ...personsStateRef.current,
        ...patch,
        page: 1,
      });
    },
    [replaceListState],
  );

  const loading = isLoading || isFetching;

  const deleteMutation = useMutation({
    mutationFn: async (row: PersonAttributes) => deletePerson({ id: row.id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['persons'] });
    },
  });

  const handleDelete = useCallback(
    (row: PersonAttributes) => {
      if (deleteMutation.isPending) return;
      const ok = window.confirm(`Excluir "${row.full_name}"?`);
      if (!ok) return;
      deleteMutation.mutate(row);
    },
    [deleteMutation],
  );

  const handleEdit = useCallback(
    (row: PersonAttributes) => {
      router.push(`${basePath}/${row.id}/edit`);
    },
    [router, basePath],
  );

  const [searchDraft, setSearchDraft] = useState(personsState.fullName);

  useEffect(() => {
    const id = requestAnimationFrame(() => setSearchDraft(personsState.fullName));
    return () => cancelAnimationFrame(id);
  }, [personsState.fullName]);

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
          ...personsStateRef.current,
          fullName: trimmed,
          page: 1,
        });
      }, 300);
    },
    [replaceListState],
  );

  return (
    <Page.Root>
      <Page.Header title={title} href={newHref}>
        {profile === 'student' ? 'Novo aluno' : 'Novo professor'}
      </Page.Header>

      <PersonsFiltersDrawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        showGuardianFilter={enableGuardianFilter && profile === 'student'}
        showModalityFilter={enableModalityFilter && profile === 'teacher'}
        committed={filtersCommitted}
        onApply={handleApplyDrawerFilters}
      />

      <Page.Filters>
        <Page.FiltersControls>
          <Page.FiltersSearch
            value={searchDraft}
            onChange={handleSearchChange}
            name="person-name-filter"
            autoComplete="off"
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
          <PersonsFilterBadges
            state={personsState}
            modalityLookup={enableModalityFilter ? modalityLookup : undefined}
            onClearFullName={() =>
              replaceListState({
                ...personsStateRef.current,
                fullName: '',
                page: 1,
              })
            }
            onClearEmail={() =>
              replaceListState({
                ...personsStateRef.current,
                email: '',
                page: 1,
              })
            }
            onClearStatus={() =>
              replaceListState({
                ...personsStateRef.current,
                status: '',
                page: 1,
              })
            }
            onClearGuardian={() =>
              replaceListState({
                ...personsStateRef.current,
                guardianPersonId: '',
                guardianPersonName: '',
                page: 1,
              })
            }
            onClearModalities={
              enableModalityFilter && profile === 'teacher'
                ? () =>
                    replaceListState({
                      ...personsStateRef.current,
                      modalityIds: [],
                      page: 1,
                    })
                : undefined
            }
            onClearCreatedRange={() =>
              replaceListState({
                ...personsStateRef.current,
                createdFrom: '',
                createdTo: '',
                page: 1,
              })
            }
            onClearUpdatedRange={() =>
              replaceListState({
                ...personsStateRef.current,
                updatedFrom: '',
                updatedTo: '',
                page: 1,
              })
            }
          />
        </Page.FiltersControls>
        <Page.FiltersDrawerTrigger onClick={() => setFiltersOpen(true)} />
      </Page.Filters>

      <Page.List>
        <DataGrid.Table<PersonAttributes>
          data={response?.data ?? []}
          columns={columns}
          sort={personsState.sort}
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
