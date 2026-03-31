'use client';

import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { UserAttributes } from '@/types/api';
import { ApiResponse } from '@/lib/api';
import { DataGrid } from '@/components/DataGrid';

function toPositiveInt(value: string | null, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.trunc(n);
  return i > 0 ? i : fallback;
}

function getSort(searchParams: URLSearchParams): Array<{ key: string; direction: 'asc' | 'desc' }> {
  const result: Array<{ key: string; direction: 'asc' | 'desc' }> = [];
  for (const [key, value] of searchParams.entries()) {
    if (!key.startsWith('orderBy[') || !key.endsWith(']')) continue;
    const field = key.slice('orderBy['.length, -1);
    if (!field) continue;
    const dir = value === 'desc' ? 'desc' : value === 'asc' ? 'asc' : null;
    if (!dir) continue;
    result.push({ key: field, direction: dir });
  }
  return result;
}

export default function UserPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = toPositiveInt(searchParams.get('page'), 1);
  const sort = useMemo(() => getSort(new URLSearchParams(searchParams.toString())), [searchParams]);

  const {
    data: response,
    isLoading,
    isFetching,
  } = useQuery<ApiResponse<UserAttributes[]>>({
    queryKey: ['users', { page, sort }],
    queryFn: async () => {
      const params = new URLSearchParams(searchParams.toString());
      const res = await fetch(`/api/user?${params.toString()}`);
      return (await res.json()) as ApiResponse<UserAttributes[]>;
    },
    placeholderData: (prev) => prev,
  });

  const columns = useMemo(
    () => [
      { key: 'id', title: '#', priority: 0, sortable: true },
      { key: 'name', title: 'Nome', priority: 1, sortable: true },
      { key: 'email', title: 'E-mail', priority: 2, sortable: true },
      { key: 'created_at', title: 'Criado em', priority: 3, sortable: true },
      { key: 'updated_at', title: 'Atualizado em', priority: 4, sortable: true },
    ],
    [],
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextPage <= 1) params.delete('page');
      else params.set('page', String(nextPage));
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const handleSortChange = useCallback(
    (next: Array<{ key: string; direction: 'asc' | 'desc' }>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const key of Array.from(params.keys())) {
        if (key.startsWith('orderBy[') && key.endsWith(']')) params.delete(key);
      }
      for (const s of next) {
        params.append(`orderBy[${s.key}]`, s.direction);
      }
      params.delete('page');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  return (
    <div>
      <DataGrid
        data={response?.data ?? []}
        onPageChange={handlePageChange}
        meta={response?.meta}
        columns={columns}
        sort={sort}
        onSortChange={handleSortChange}
        loading={isLoading || isFetching}
      />
    </div>
  );
}
