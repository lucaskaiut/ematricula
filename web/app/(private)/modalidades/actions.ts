import type { ApiResponse } from '@/lib/api';
import type { ModalityAttributes } from '@/types/api';

export type ModalitySort = Array<{ key: string; direction: 'asc' | 'desc' }>;

export function modalitiesQueryKey(input: {
  page: number;
  sort: ModalitySort;
  name: string;
  description: string;
  createdFrom: string;
  createdTo: string;
  updatedFrom: string;
  updatedTo: string;
}) {
  return ['modalities', input] as const;
}

export async function listModalities(input: { searchParams: URLSearchParams }) {
  const res = await fetch(`/api/modalities?${input.searchParams.toString()}`);
  if (!res.ok) throw new Error('Falha ao carregar modalidades');
  return (await res.json()) as ApiResponse<ModalityAttributes[]>;
}

export async function deleteModality(input: { id: ModalityAttributes['id'] }) {
  const res = await fetch(`/api/modalities/${input.id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao excluir modalidade');
  return (await res.json()) as ApiResponse<unknown>;
}
