import {
  URL_ENCODED_STATE_KEY,
  decodeUrlStatePayload,
  encodeUrlStatePayload,
} from '@/lib/url-state';
import type { EnrollmentStatus } from '@/types/api';

export type MatriculasListUrlState = {
  v: 8;
  page: number;
  sort: Array<{ key: string; direction: 'asc' | 'desc' }>;
  classGroupId: number | null;
  studentPersonId: number | null;
  status: '' | EnrollmentStatus;
};

function toPositiveInt(value: string | null, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.trunc(n);
  return i > 0 ? i : fallback;
}

function getSortFromSearchParams(
  searchParams: URLSearchParams,
): Array<{ key: string; direction: 'asc' | 'desc' }> {
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

function parseStatus(raw: string | null): '' | EnrollmentStatus {
  if (raw === 'active' || raw === 'locked' || raw === 'cancelled') return raw;
  return '';
}

export function defaultMatriculasListUrlState(): MatriculasListUrlState {
  return {
    v: 8,
    page: 1,
    sort: [],
    classGroupId: null,
    studentPersonId: null,
    status: '',
  };
}

export function normalizeMatriculasListUrlState(
  input: MatriculasListUrlState,
): MatriculasListUrlState {
  const sort = input.sort.filter(
    (s): s is { key: string; direction: 'asc' | 'desc' } =>
      !!s &&
      typeof s.key === 'string' &&
      s.key.length > 0 &&
      (s.direction === 'asc' || s.direction === 'desc'),
  );
  let classGroupId: number | null =
    typeof input.classGroupId === 'number' && Number.isFinite(input.classGroupId)
      ? Math.trunc(input.classGroupId)
      : null;
  if (classGroupId !== null && classGroupId <= 0) classGroupId = null;

  let studentPersonId: number | null =
    typeof input.studentPersonId === 'number' && Number.isFinite(input.studentPersonId)
      ? Math.trunc(input.studentPersonId)
      : null;
  if (studentPersonId !== null && studentPersonId <= 0) studentPersonId = null;

  const status = parseStatus(typeof input.status === 'string' ? input.status : '');

  return {
    v: 8,
    page: Math.max(1, Math.trunc(Number(input.page)) || 1),
    sort,
    classGroupId,
    studentPersonId,
    status,
  };
}

export function parseLegacyMatriculasListUrlState(
  searchParams: URLSearchParams,
): MatriculasListUrlState {
  const cg = searchParams.get('filters[class_group_id]');
  const st = searchParams.get('filters[student_person_id]');
  const stat = searchParams.get('filters[status]');

  return normalizeMatriculasListUrlState({
    v: 8,
    page: toPositiveInt(searchParams.get('page'), 1),
    sort: getSortFromSearchParams(searchParams),
    classGroupId: cg ? toPositiveInt(cg, 0) || null : null,
    studentPersonId: st ? toPositiveInt(st, 0) || null : null,
    status: parseStatus(stat),
  });
}

function isDecodedMatriculasState(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  if (o.v !== 8) return false;
  if (!Array.isArray(o.sort)) return false;
  return true;
}

function toNullablePositiveInt(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  return i > 0 ? i : null;
}

function decodedToMatriculasListState(o: Record<string, unknown>): MatriculasListUrlState {
  const page = typeof o.page === 'number' ? o.page : Number(o.page);
  return normalizeMatriculasListUrlState({
    v: 8,
    page: Number.isFinite(page) ? page : 1,
    sort: o.sort as MatriculasListUrlState['sort'],
    classGroupId: toNullablePositiveInt(o.classGroupId),
    studentPersonId: toNullablePositiveInt(o.studentPersonId),
    status: parseStatus(typeof o.status === 'string' ? o.status : ''),
  });
}

export function parseMatriculasListUrlState(
  searchParams: URLSearchParams,
): MatriculasListUrlState {
  const packed = searchParams.get(URL_ENCODED_STATE_KEY);
  if (packed) {
    const decoded = decodeUrlStatePayload<unknown>(packed);
    if (isDecodedMatriculasState(decoded)) {
      return decodedToMatriculasListState(decoded);
    }
  }
  return parseLegacyMatriculasListUrlState(searchParams);
}

export function hasMatriculasListLegacyFlatParams(searchParams: URLSearchParams): boolean {
  if (searchParams.has('page')) return true;
  for (const key of searchParams.keys()) {
    if (key.startsWith('orderBy[') || key.startsWith('filters[')) return true;
  }
  return false;
}

export function encodeMatriculasListUrlState(state: MatriculasListUrlState): string | null {
  const normalized = normalizeMatriculasListUrlState(state);
  const baseline = defaultMatriculasListUrlState();
  if (
    normalized.page === baseline.page &&
    normalized.sort.length === 0 &&
    normalized.classGroupId === null &&
    normalized.studentPersonId === null &&
    normalized.status === ''
  ) {
    return null;
  }
  return encodeUrlStatePayload(normalized);
}

export function buildMatriculasListPath(
  pathname: string,
  state: MatriculasListUrlState,
  extraSearchParams?: URLSearchParams,
): string {
  const encoded = encodeMatriculasListUrlState(state);
  const params = new URLSearchParams();
  if (extraSearchParams) {
    extraSearchParams.forEach((value, key) => {
      if (key === URL_ENCODED_STATE_KEY) return;
      params.append(key, value);
    });
  }
  if (encoded) params.set(URL_ENCODED_STATE_KEY, encoded);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function matriculasListStateToApiParams(state: MatriculasListUrlState): URLSearchParams {
  const normalized = normalizeMatriculasListUrlState(state);
  const p = new URLSearchParams();
  if (normalized.page > 1) p.set('page', String(normalized.page));
  for (const s of normalized.sort) {
    p.append(`orderBy[${s.key}]`, s.direction);
  }
  if (normalized.classGroupId !== null) {
    p.set('filters[class_group_id]', String(normalized.classGroupId));
  }
  if (normalized.studentPersonId !== null) {
    p.set('filters[student_person_id]', String(normalized.studentPersonId));
  }
  if (normalized.status !== '') {
    p.set('filters[status]', normalized.status);
  }
  return p;
}

export function removeUpdatedParam(searchParams: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(searchParams.toString());
  next.delete('updated');
  return next;
}
