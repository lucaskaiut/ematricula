import type { ApiResponse } from '@/lib/api';
import type { UserAttributes } from '@/types/api';

export type UserSort = Array<{ key: string; direction: 'asc' | 'desc' }>;

export function usersQueryKey(input: {
  page: number;
  sort: UserSort;
  name: string;
  email: string;
  createdFrom: string;
  createdTo: string;
  updatedFrom: string;
  updatedTo: string;
}) {
  return ['users', input] as const;
}

export async function listUsers(input: { searchParams: URLSearchParams }) {
  const res = await fetch(`/api/user?${input.searchParams.toString()}`);
  if (!res.ok) throw new Error('Falha ao carregar usuários');
  return (await res.json()) as ApiResponse<UserAttributes[]>;
}

export async function deleteUser(input: { id: UserAttributes['id'] }) {
  const res = await fetch(`/api/user/${input.id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao excluir usuário');
  return (await res.json()) as ApiResponse<unknown>;
}

export async function updateUser(input: { id: UserAttributes['id']; body: Partial<UserAttributes> }) {
  const res = await fetch(`/api/user/${input.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input.body),
  });
  if (!res.ok) throw new Error('Falha ao editar usuário');
  return (await res.json()) as ApiResponse<UserAttributes>;
}

