import {
  URL_ENCODED_STATE_KEY,
  decodeUrlStatePayload,
  encodeUrlStatePayload,
} from '@/lib/url-state';

export type PlanosListUrlState = {
  v: 10;
  page: number;
  sort: Array<{ key: string; direction: 'asc' | 'desc' }>;
  name: string;
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

const LIKE = 'like';

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
  if (op === LIKE && raw !== null && raw !== '') {
    return stripLikeWildcards(raw);
  }
  const legacy = searchParams.get(`filters[${field}]`);
  return (legacy ?? '').trim();
}

export function defaultPlanosListUrlState(): PlanosListUrlState {
  return {
    v: 10,
    page: 1,
    sort: [],
    name: '',
  };
}

export function normalizePlanosListUrlState(input: PlanosListUrlState): PlanosListUrlState {
  const sort = input.sort.filter(
    (s): s is { key: string; direction: 'asc' | 'desc' } =>
      !!s &&
      typeof s.key === 'string' &&
      s.key.length > 0 &&
      (s.direction === 'asc' || s.direction === 'desc'),
  );
  return {
    v: 10,
    page: Math.max(1, Math.trunc(Number(input.page)) || 1),
    sort,
    name: typeof input.name === 'string' ? input.name : '',
  };
}

export function parseLegacyPlanosListUrlState(searchParams: URLSearchParams): PlanosListUrlState {
  return normalizePlanosListUrlState({
    v: 10,
    page: toPositiveInt(searchParams.get('page'), 1),
    sort: getSortFromSearchParams(searchParams),
    name: getLikeFilterDisplay(searchParams, 'name'),
  });
}

function isDecodedPlanosState(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  if (o.v !== 10) return false;
  if (!Array.isArray(o.sort)) return false;
  if (typeof o.name !== 'string') return false;
  return true;
}

function decodedToPlanosListState(o: Record<string, unknown>): PlanosListUrlState {
  const page = typeof o.page === 'number' ? o.page : Number(o.page);
  return normalizePlanosListUrlState({
    v: 10,
    page: Number.isFinite(page) ? page : 1,
    sort: o.sort as PlanosListUrlState['sort'],
    name: o.name as string,
  });
}

export function parsePlanosListUrlState(searchParams: URLSearchParams): PlanosListUrlState {
  const packed = searchParams.get(URL_ENCODED_STATE_KEY);
  if (packed) {
    const decoded = decodeUrlStatePayload<unknown>(packed);
    if (isDecodedPlanosState(decoded)) {
      return decodedToPlanosListState(decoded);
    }
  }
  return parseLegacyPlanosListUrlState(searchParams);
}

export function hasPlanosListLegacyFlatParams(searchParams: URLSearchParams): boolean {
  if (searchParams.has('page')) return true;
  for (const key of searchParams.keys()) {
    if (key.startsWith('orderBy[') || key.startsWith('filters[')) return true;
  }
  return false;
}

export function encodePlanosListUrlState(state: PlanosListUrlState): string | null {
  const normalized = normalizePlanosListUrlState(state);
  const baseline = defaultPlanosListUrlState();
  if (
    normalized.page === baseline.page &&
    normalized.sort.length === 0 &&
    normalized.name.trim() === ''
  ) {
    return null;
  }
  return encodeUrlStatePayload(normalized);
}

export function buildPlanosListPath(
  pathname: string,
  state: PlanosListUrlState,
  extraSearchParams?: URLSearchParams,
): string {
  const encoded = encodePlanosListUrlState(state);
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

export function planosListStateToApiParams(state: PlanosListUrlState): URLSearchParams {
  const normalized = normalizePlanosListUrlState(state);
  const p = new URLSearchParams();
  if (normalized.page > 1) p.set('page', String(normalized.page));
  for (const s of normalized.sort) {
    p.append(`orderBy[${s.key}]`, s.direction);
  }
  const name = normalized.name.trim();
  if (name) {
    p.set('filters[name][0]', LIKE);
    p.set('filters[name][1]', `%${name}%`);
  }
  return p;
}

export function removeUpdatedParam(searchParams: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(searchParams.toString());
  next.delete('updated');
  return next;
}
