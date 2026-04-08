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
import { URL_ENCODED_STATE_KEY } from '@/lib/url-state';
import { UserAttributes } from '@/types/api';
import { DataGrid } from '@/components/DataGrid';
import { Page } from '@/components/Page';
import { deleteUser, listUsers, usersQueryKey } from './actions';
import { UsersFilterBadges } from './users-filter-badges';
import { UsersFiltersDrawer } from './users-filters-drawer';
import {
  buildUsersListPath,
  hasUsersListLegacyFlatParams,
  normalizeUsersListUrlState,
  parseLegacyUsersListUrlState,
  parseUsersListUrlState,
  removeUpdatedParam,
  usersListStateToApiParams,
  type UsersListUrlState,
} from './users-url-state';

function formatDateTime(value: unknown) {
  if (typeof value !== 'string' || !value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

export default function UserPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const usersState = useMemo(
    () => parseUsersListUrlState(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const listUpdated = searchParams.get('updated');

  useEffect(() => {
    if (searchParams.get(URL_ENCODED_STATE_KEY)) return;
    if (!hasUsersListLegacyFlatParams(searchParams)) return;
    const legacyState = parseLegacyUsersListUrlState(searchParams);
    const extra = new URLSearchParams();
    if (searchParams.get('updated') === '1') extra.set('updated', '1');
    router.replace(buildUsersListPath(pathname, legacyState, extra));
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (listUpdated !== '1') return;
    void queryClient.invalidateQueries({ queryKey: ['users'] });
    const next = removeUpdatedParam(searchParams);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [listUpdated, pathname, queryClient, router, searchParams]);

  const {
    data: response,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: usersQueryKey({
      page: usersState.page,
      sort: usersState.sort,
      name: usersState.name.trim(),
      email: usersState.email.trim(),
      createdFrom: usersState.createdFrom,
      createdTo: usersState.createdTo,
      updatedFrom: usersState.updatedFrom,
      updatedTo: usersState.updatedTo,
    }),
    queryFn: async () =>
      listUsers({ searchParams: usersListStateToApiParams(usersState) }),
    placeholderData: (prev) => prev,
  });

  const columns = useMemo(
    () => [
      { key: 'id', title: '#', priority: 0, sortable: true, width: 60 },
      { key: 'name', title: 'Nome', priority: 1, sortable: true, width: 280 },
      {
        key: 'role',
        title: 'Perfil',
        priority: 2,
        sortable: false,
        width: 160,
        render: (row: UserAttributes) => row.role?.name ?? '—',
      },
      {
        key: 'email',
        title: 'E-mail',
        priority: 3,
        sortable: true,
        width: 280,
      },
      {
        key: 'created_at',
        title: 'Criado em',
        priority: 4,
        sortable: true,
        format: (value: unknown) => formatDateTime(value),
        width: 200,
      },
      {
        key: 'updated_at',
        title: 'Atualizado em',
        priority: 5,
        sortable: true,
        format: (value: unknown) => formatDateTime(value),
        width: 200,
      },
    ],
    [],
  );

  const usersStateRef = useRef(usersState);
  useLayoutEffect(() => {
    usersStateRef.current = usersState;
  }, [usersState]);

  const replaceListState = useCallback(
    (next: UsersListUrlState) => {
      const normalized = normalizeUsersListUrlState(next);
      const extra = new URLSearchParams();
      if (searchParams.get('updated') === '1') extra.set('updated', '1');
      router.replace(buildUsersListPath(pathname, normalized, extra));
    },
    [pathname, router, searchParams],
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      replaceListState({ ...usersStateRef.current, page: nextPage });
    },
    [replaceListState],
  );

  const handleSortChange = useCallback(
    (next: Array<{ key: string; direction: 'asc' | 'desc' }>) => {
      replaceListState({
        ...usersStateRef.current,
        sort: next,
        page: 1,
      });
    },
    [replaceListState],
  );

  const handleApplyDrawerFilters = useCallback(
    (
      patch: Pick<
        UsersListUrlState,
        'email' | 'createdFrom' | 'createdTo' | 'updatedFrom' | 'updatedTo'
      >,
    ) => {
      replaceListState({
        ...usersStateRef.current,
        ...patch,
        page: 1,
      });
    },
    [replaceListState],
  );

  const loading = isLoading || isFetching;

  const deleteMutation = useMutation({
    mutationFn: async (user: UserAttributes) => deleteUser({ id: user.id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleDelete = useCallback(
    (user: UserAttributes) => {
      if (deleteMutation.isPending) return;
      const ok = window.confirm(`Excluir o usuário "${user.name}"?`);
      if (!ok) return;
      deleteMutation.mutate(user);
    },
    [deleteMutation],
  );

  const handleEdit = useCallback(
    (user: UserAttributes) => {
      router.push(`/users/${user.id}/edit`);
    },
    [router],
  );

  const [searchDraft, setSearchDraft] = useState(usersState.name);

  useEffect(() => {
    const id = requestAnimationFrame(() => setSearchDraft(usersState.name));
    return () => cancelAnimationFrame(id);
  }, [usersState.name]);

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
          ...usersStateRef.current,
          name: trimmed,
          page: 1,
        });
      }, 300);
    },
    [replaceListState],
  );

  return (
    <Page.Root>
      <Page.Header title="Usuários" href="/users/new">
        Novo usuário
      </Page.Header>

      <UsersFiltersDrawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        committed={{
          email: usersState.email,
          createdFrom: usersState.createdFrom,
          createdTo: usersState.createdTo,
          updatedFrom: usersState.updatedFrom,
          updatedTo: usersState.updatedTo,
        }}
        onApply={handleApplyDrawerFilters}
      />

      <Page.Filters>
        <Page.FiltersControls>
          <Page.FiltersSearch
            value={searchDraft}
            onChange={handleSearchChange}
            name="user-name-filter"
            autoComplete="off"
            placeholder="Pesquisar por nome…"
            aria-label="Pesquisar usuário por nome"
          />
          <UsersFilterBadges
            state={usersState}
            onClearName={() =>
              replaceListState({
                ...usersStateRef.current,
                name: '',
                page: 1,
              })
            }
            onClearEmail={() =>
              replaceListState({
                ...usersStateRef.current,
                email: '',
                page: 1,
              })
            }
            onClearCreatedRange={() =>
              replaceListState({
                ...usersStateRef.current,
                createdFrom: '',
                createdTo: '',
                page: 1,
              })
            }
            onClearUpdatedRange={() =>
              replaceListState({
                ...usersStateRef.current,
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
        <DataGrid.Table<UserAttributes>
          data={response?.data ?? []}
          columns={columns}
          sort={usersState.sort}
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
