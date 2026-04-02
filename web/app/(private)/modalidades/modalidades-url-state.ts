import {
  URL_ENCODED_STATE_KEY,
  decodeUrlStatePayload,
  encodeUrlStatePayload,
} from '@/lib/url-state';

export type ModalitiesListUrlState = {
  v: 6;
  page: number;
  sort: Array<{ key: string; direction: 'asc' | 'desc' }>;
  name: string;
  description: string;
  createdFrom: string;
  createdTo: string;
  updatedFrom: string;
  updatedTo: string;
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

function getBetweenRangeFromParams(searchParams: URLSearchParams, field: string) {
  const op = searchParams.get(`filters[${field}][0]`);
  const a = searchParams.get(`filters[${field}][1]`);
  const b = searchParams.get(`filters[${field}][2]`);
  if (op?.toLowerCase() !== 'between' || !a || !b) {
    return { from: '', to: '' };
  }
  return { from: a, to: b };
}

export function defaultModalitiesListUrlState(): ModalitiesListUrlState {
  return {
    v: 6,
    page: 1,
    sort: [],
    name: '',
    description: '',
    createdFrom: '',
    createdTo: '',
    updatedFrom: '',
    updatedTo: '',
  };
}

export function normalizeModalitiesListUrlState(
  input: ModalitiesListUrlState,
): ModalitiesListUrlState {
  const sort = input.sort.filter(
    (s): s is { key: string; direction: 'asc' | 'desc' } =>
      !!s &&
      typeof s.key === 'string' &&
      s.key.length > 0 &&
      (s.direction === 'asc' || s.direction === 'desc'),
  );
  return {
    v: 6,
    page: Math.max(1, Math.trunc(Number(input.page)) || 1),
    sort,
    name: typeof input.name === 'string' ? input.name : '',
    description: typeof input.description === 'string' ? input.description : '',
    createdFrom: typeof input.createdFrom === 'string' ? input.createdFrom : '',
    createdTo: typeof input.createdTo === 'string' ? input.createdTo : '',
    updatedFrom: typeof input.updatedFrom === 'string' ? input.updatedFrom : '',
    updatedTo: typeof input.updatedTo === 'string' ? input.updatedTo : '',
  };
}

export function parseLegacyModalitiesListUrlState(
  searchParams: URLSearchParams,
): ModalitiesListUrlState {
  const created = getBetweenRangeFromParams(searchParams, 'created_at');
  const updated = getBetweenRangeFromParams(searchParams, 'updated_at');
  return normalizeModalitiesListUrlState({
    v: 6,
    page: toPositiveInt(searchParams.get('page'), 1),
    sort: getSortFromSearchParams(searchParams),
    name: getLikeFilterDisplay(searchParams, 'name'),
    description: getLikeFilterDisplay(searchParams, 'description'),
    createdFrom: created.from,
    createdTo: created.to,
    updatedFrom: updated.from,
    updatedTo: updated.to,
  });
}

function isDecodedModalitiesState(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  if (o.v !== 6) return false;
  if (!Array.isArray(o.sort)) return false;
  if (typeof o.name !== 'string') return false;
  return true;
}

function decodedToModalitiesListState(o: Record<string, unknown>): ModalitiesListUrlState {
  const page = typeof o.page === 'number' ? o.page : Number(o.page);
  return normalizeModalitiesListUrlState({
    v: 6,
    page: Number.isFinite(page) ? page : 1,
    sort: o.sort as ModalitiesListUrlState['sort'],
    name: o.name as string,
    description: typeof o.description === 'string' ? o.description : '',
    createdFrom: typeof o.createdFrom === 'string' ? o.createdFrom : '',
    createdTo: typeof o.createdTo === 'string' ? o.createdTo : '',
    updatedFrom: typeof o.updatedFrom === 'string' ? o.updatedFrom : '',
    updatedTo: typeof o.updatedTo === 'string' ? o.updatedTo : '',
  });
}

export function parseModalitiesListUrlState(
  searchParams: URLSearchParams,
): ModalitiesListUrlState {
  const packed = searchParams.get(URL_ENCODED_STATE_KEY);
  if (packed) {
    const decoded = decodeUrlStatePayload<unknown>(packed);
    if (isDecodedModalitiesState(decoded)) {
      return decodedToModalitiesListState(decoded);
    }
  }
  return parseLegacyModalitiesListUrlState(searchParams);
}

export function hasModalitiesListLegacyFlatParams(searchParams: URLSearchParams): boolean {
  if (searchParams.has('page')) return true;
  for (const key of searchParams.keys()) {
    if (key.startsWith('orderBy[') || key.startsWith('filters[')) return true;
  }
  return false;
}

export function encodeModalitiesListUrlState(state: ModalitiesListUrlState): string | null {
  const normalized = normalizeModalitiesListUrlState(state);
  const baseline = defaultModalitiesListUrlState();
  if (
    normalized.page === baseline.page &&
    normalized.sort.length === 0 &&
    normalized.name.trim() === '' &&
    normalized.description.trim() === '' &&
    normalized.createdFrom === '' &&
    normalized.createdTo === '' &&
    normalized.updatedFrom === '' &&
    normalized.updatedTo === ''
  ) {
    return null;
  }
  return encodeUrlStatePayload(normalized);
}

export function buildModalitiesListPath(
  pathname: string,
  state: ModalitiesListUrlState,
  extraSearchParams?: URLSearchParams,
): string {
  const encoded = encodeModalitiesListUrlState(state);
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

export function modalitiesListStateToApiParams(state: ModalitiesListUrlState): URLSearchParams {
  const normalized = normalizeModalitiesListUrlState(state);
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
  const description = normalized.description.trim();
  if (description) {
    p.set('filters[description][0]', LIKE);
    p.set('filters[description][1]', `%${description}%`);
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
