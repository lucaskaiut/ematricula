import type { ApiResponse } from '@/lib/api';
import type { PlanAttributes } from '@/types/api';

export type PlanSort = Array<{ key: string; direction: 'asc' | 'desc' }>;

export function planosQueryKey(input: { page: number; sort: PlanSort; name: string }) {
  return ['plans', input] as const;
}

export async function listPlans(input: { searchParams: URLSearchParams }) {
  const res = await fetch(`/api/plans?${input.searchParams.toString()}`);
  if (!res.ok) throw new Error('Falha ao carregar planos');
  return (await res.json()) as ApiResponse<PlanAttributes[]>;
}

export async function deletePlan(input: { id: PlanAttributes['id'] }) {
  const res = await fetch(`/api/plans/${input.id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao excluir plano');
  return (await res.json()) as ApiResponse<unknown>;
}
