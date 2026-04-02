import type { ApiResponse } from '@/lib/api';
import type { PersonAttributes, PersonProfile } from '@/types/api';

export type PersonSort = Array<{ key: string; direction: 'asc' | 'desc' }>;

export function personsQueryKey(input: {
  profile: PersonProfile;
  page: number;
  sort: PersonSort;
  fullName: string;
  email: string;
  status: '' | 'active' | 'inactive';
  guardianPersonId: string;
  createdFrom: string;
  createdTo: string;
  updatedFrom: string;
  updatedTo: string;
}) {
  return ['persons', input] as const;
}

export async function listPersons(input: {
  profile: PersonProfile;
  searchParams: URLSearchParams;
}) {
  const res = await fetch(`/api/persons?${input.searchParams.toString()}`);
  if (!res.ok) throw new Error('Falha ao carregar pessoas');
  return (await res.json()) as ApiResponse<PersonAttributes[]>;
}

export async function listGuardianOptions() {
  const p = new URLSearchParams();
  p.set('filters[eligible_as_guardian]', '1');
  p.set('per_page', '100');
  const res = await fetch(`/api/persons?${p.toString()}`);
  if (!res.ok) throw new Error('Falha ao carregar responsáveis');
  return (await res.json()) as ApiResponse<PersonAttributes[]>;
}

export async function searchPeople(term: string) {
  const p = new URLSearchParams();
  p.set('filters[eligible_as_guardian]', '1');
  const q = term.trim();
  if (q.length > 0) {
    p.set('filters[full_name][0]', 'like');
    p.set('filters[full_name][1]', `%${q}%`);
  }
  p.set('per_page', '20');
  const res = await fetch(`/api/persons?${p.toString()}`);
  if (!res.ok) throw new Error('Falha ao buscar pessoas');
  const body = (await res.json()) as ApiResponse<PersonAttributes[]>;
  return body.data ?? [];
}

export async function deletePerson(input: { id: PersonAttributes['id'] }) {
  const res = await fetch(`/api/persons/${input.id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao excluir');
  return (await res.json()) as ApiResponse<unknown>;
}
