import {
  URL_ENCODED_STATE_KEY,
  decodeUrlStatePayload,
  encodeUrlStatePayload,
} from '@/lib/url-state';

import type { PersonProfile } from '@/types/api';

export type PersonsListUrlState = {
  v: 3;
  page: number;
  sort: Array<{ key: string; direction: 'asc' | 'desc' }>;
  fullName: string;
  email: string;
  status: '' | 'active' | 'inactive';
  guardianPersonId: string;
  guardianPersonName: string;
  createdFrom: string;
  createdTo: string;
  updatedFrom: string;
  updatedTo: string;
};

export type PersonsListConfig = {
  profile: PersonProfile;
  basePath: string;
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

const NAME_FILTER_LIKE = 'like';

function stripLikeWildcards(value: string) {
  if (value.length >= 2 && value.startsWith('%') && value.endsWith('%')) {
    return value.slice(1, -1);
  }
  return value;
}

function getLikeFilterDisplay(searchParams: URLSearchParams, field: string) {
  const opKey = `filters[${field}][0]`;
  const valKey = `filters[${field}][1]`;
  const op = searchParams.get(opKey);
  const raw = searchParams.get(valKey);
  if (op === NAME_FILTER_LIKE && raw !== null && raw !== '') {
    return stripLikeWildcards(raw);
  }
  const legacy = searchParams.get(`filters[${field}]`);
  return (legacy ?? '').trim();
}

function getBetweenRangeFromParams(searchParams: URLSearchParams, field: string) {
  const op = searchParams.get(`filters[${field}][0]`);
  const a = searchParams.get(`filters[${field}][1]`);
  const b = searchParams.get(`filters[${field}][2]`);
  if (op?.toLowerCase() !== 'between' || !a || !b) {
    return { from: '', to: '' };
  }
  return { from: a, to: b };
}

function getStatusFromParams(searchParams: URLSearchParams): '' | 'active' | 'inactive' {
  const raw = searchParams.get('filters[status]');
  if (raw === 'active' || raw === 'inactive') return raw;
  return '';
}

function getGuardianPersonIdFromParams(searchParams: URLSearchParams): string {
  const raw = searchParams.get('filters[guardian_person_id]');
  if (raw === null || raw === '') return '';
  return /^\d+$/.test(raw) ? raw : '';
}

export function defaultPersonsListUrlState(): PersonsListUrlState {
  return {
    v: 3,
    page: 1,
    sort: [],
    fullName: '',
    email: '',
    status: '',
    guardianPersonId: '',
    guardianPersonName: '',
    createdFrom: '',
    createdTo: '',
    updatedFrom: '',
    updatedTo: '',
  };
}

export function normalizePersonsListUrlState(input: PersonsListUrlState): PersonsListUrlState {
  const sort = input.sort.filter(
    (s): s is { key: string; direction: 'asc' | 'desc' } =>
      !!s &&
      typeof s.key === 'string' &&
      s.key.length > 0 &&
      (s.direction === 'asc' || s.direction === 'desc'),
  );
  const status =
    input.status === 'active' || input.status === 'inactive' ? input.status : '';
  const guardianPersonId =
    typeof input.guardianPersonId === 'string' && /^\d*$/.test(input.guardianPersonId)
      ? input.guardianPersonId
      : '';
  const guardianPersonName =
    guardianPersonId === ''
      ? ''
      : typeof input.guardianPersonName === 'string'
        ? input.guardianPersonName
        : '';
  return {
    v: 3,
    page: Math.max(1, Math.trunc(Number(input.page)) || 1),
    sort,
    fullName: typeof input.fullName === 'string' ? input.fullName : '',
    email: typeof input.email === 'string' ? input.email : '',
    status,
    guardianPersonId,
    guardianPersonName,
    createdFrom: typeof input.createdFrom === 'string' ? input.createdFrom : '',
    createdTo: typeof input.createdTo === 'string' ? input.createdTo : '',
    updatedFrom: typeof input.updatedFrom === 'string' ? input.updatedFrom : '',
    updatedTo: typeof input.updatedTo === 'string' ? input.updatedTo : '',
  };
}

export function parseLegacyPersonsListUrlState(
  searchParams: URLSearchParams,
): PersonsListUrlState {
  const created = getBetweenRangeFromParams(searchParams, 'created_at');
  const updated = getBetweenRangeFromParams(searchParams, 'updated_at');
  return normalizePersonsListUrlState({
    v: 3,
    page: toPositiveInt(searchParams.get('page'), 1),
    sort: getSortFromSearchParams(searchParams),
    fullName: getLikeFilterDisplay(searchParams, 'full_name'),
    email: getLikeFilterDisplay(searchParams, 'email'),
    status: getStatusFromParams(searchParams),
    guardianPersonId: getGuardianPersonIdFromParams(searchParams),
    guardianPersonName: '',
    createdFrom: created.from,
    createdTo: created.to,
    updatedFrom: updated.from,
    updatedTo: updated.to,
  });
}

function isDecodedPersonsState(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  if (o.v !== 3) return false;
  if (!Array.isArray(o.sort)) return false;
  if (typeof o.fullName !== 'string') return false;
  return true;
}

function decodedToPersonsListState(o: Record<string, unknown>): PersonsListUrlState {
  const page = typeof o.page === 'number' ? o.page : Number(o.page);
  const statusRaw = o.status;
  const status =
    statusRaw === 'active' || statusRaw === 'inactive' ? statusRaw : '';
  const gid =
    typeof o.guardianPersonId === 'string'
      ? o.guardianPersonId
      : typeof o.guardianPersonId === 'number' && Number.isFinite(o.guardianPersonId)
        ? String(Math.trunc(o.guardianPersonId))
        : '';
  return normalizePersonsListUrlState({
    v: 3,
    page: Number.isFinite(page) ? page : 1,
    sort: o.sort as PersonsListUrlState['sort'],
    fullName: o.fullName as string,
    email: typeof o.email === 'string' ? o.email : '',
    status,
    guardianPersonId: gid,
    guardianPersonName:
      typeof o.guardianPersonName === 'string' ? o.guardianPersonName : '',
    createdFrom: typeof o.createdFrom === 'string' ? o.createdFrom : '',
    createdTo: typeof o.createdTo === 'string' ? o.createdTo : '',
    updatedFrom: typeof o.updatedFrom === 'string' ? o.updatedFrom : '',
    updatedTo: typeof o.updatedTo === 'string' ? o.updatedTo : '',
  });
}

export function parsePersonsListUrlState(searchParams: URLSearchParams): PersonsListUrlState {
  const packed = searchParams.get(URL_ENCODED_STATE_KEY);
  if (packed) {
    const decoded = decodeUrlStatePayload<unknown>(packed);
    if (isDecodedPersonsState(decoded)) {
      return decodedToPersonsListState(decoded);
    }
  }
  return parseLegacyPersonsListUrlState(searchParams);
}

export function hasPersonsListLegacyFlatParams(searchParams: URLSearchParams): boolean {
  if (searchParams.has('page')) return true;
  for (const key of searchParams.keys()) {
    if (key.startsWith('orderBy[') || key.startsWith('filters[')) return true;
  }
  return false;
}

export function encodePersonsListUrlState(state: PersonsListUrlState): string | null {
  const normalized = normalizePersonsListUrlState(state);
  const baseline = defaultPersonsListUrlState();
  if (
    normalized.page === baseline.page &&
    normalized.sort.length === 0 &&
    normalized.fullName.trim() === '' &&
    normalized.email.trim() === '' &&
    normalized.status === '' &&
    normalized.guardianPersonId === '' &&
    normalized.createdFrom === '' &&
    normalized.createdTo === '' &&
    normalized.updatedFrom === '' &&
    normalized.updatedTo === ''
  ) {
    return null;
  }
  return encodeUrlStatePayload(normalized);
}

export function buildPersonsListPath(
  pathname: string,
  state: PersonsListUrlState,
  extraSearchParams?: URLSearchParams,
): string {
  const encoded = encodePersonsListUrlState(state);
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

export function personsListStateToApiParams(
  state: PersonsListUrlState,
  profile: PersonProfile,
): URLSearchParams {
  const normalized = normalizePersonsListUrlState(state);
  const p = new URLSearchParams();
  p.set('filters[profile]', profile);
  if (normalized.page > 1) p.set('page', String(normalized.page));
  for (const s of normalized.sort) {
    p.append(`orderBy[${s.key}]`, s.direction);
  }
  const fullName = normalized.fullName.trim();
  if (fullName) {
    p.set('filters[full_name][0]', NAME_FILTER_LIKE);
    p.set('filters[full_name][1]', `%${fullName}%`);
  }
  const email = normalized.email.trim();
  if (email) {
    p.set('filters[email]', email);
  }
  if (normalized.status !== '') {
    p.set('filters[status]', normalized.status);
  }
  if (profile === 'student' && normalized.guardianPersonId !== '') {
    p.set('filters[guardian_person_id]', normalized.guardianPersonId);
  }
  if (normalized.createdFrom && normalized.createdTo) {
    p.set('filters[created_at][0]', 'between');
    p.set('filters[created_at][1]', normalized.createdFrom);
    p.set('filters[created_at][2]', normalized.createdTo);
  }
  if (normalized.updatedFrom && normalized.updatedTo) {
    p.set('filters[updated_at][0]', 'between');
    p.set('filters[updated_at][1]', normalized.updatedFrom);
    p.set('filters[updated_at][2]', normalized.updatedTo);
  }
  return p;
}

export function removeUpdatedParam(searchParams: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(searchParams.toString());
  next.delete('updated');
  return next;
}
