import type { ApiResponse } from '@/lib/api';
import type { EnrollmentAttributes } from '@/types/api';

export type EnrollmentSort = Array<{ key: string; direction: 'asc' | 'desc' }>;

export function enrollmentsQueryKey(input: {
  page: number;
  sort: EnrollmentSort;
  classGroupId: number | null;
  studentPersonId: number | null;
  status: string;
}) {
  return ['enrollments', input] as const;
}

export async function listEnrollments(input: { searchParams: URLSearchParams }) {
  const res = await fetch(`/api/enrollments?${input.searchParams.toString()}`);
  if (!res.ok) throw new Error('Falha ao carregar matrículas');
  return (await res.json()) as ApiResponse<EnrollmentAttributes[]>;
}

export async function deleteEnrollment(input: { id: EnrollmentAttributes['id'] }) {
  const res = await fetch(`/api/enrollments/${input.id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao excluir matrícula');
  return (await res.json()) as ApiResponse<unknown>;
}
