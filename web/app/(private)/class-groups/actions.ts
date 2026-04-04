import type { ApiResponse } from '@/lib/api';
import type { ClassGroupAttributes } from '@/types/api';

export type ClassGroupSort = Array<{ key: string; direction: 'asc' | 'desc' }>;

export function classGroupsQueryKey(input: {
  page: number;
  sort: ClassGroupSort;
  name: string;
  modalityId: number | null;
  teacherPersonId: number | null;
}) {
  return ['class-groups', input] as const;
}

export async function listClassGroups(input: { searchParams: URLSearchParams }) {
  const res = await fetch(`/api/class-groups?${input.searchParams.toString()}`);
  if (!res.ok) throw new Error('Falha ao carregar turmas');
  return (await res.json()) as ApiResponse<ClassGroupAttributes[]>;
}

export async function deleteClassGroup(input: { id: ClassGroupAttributes['id'] }) {
  const res = await fetch(`/api/class-groups/${input.id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao excluir turma');
  return (await res.json()) as ApiResponse<unknown>;
}
