import 'server-only';
import { cookies } from 'next/headers';
import { ApiError } from '@/services/api-client';

const AUTH_TOKEN_COOKIE = 'auth_token';

type QueryValue = string | number | boolean | null | undefined;

export type QueryParameters = Record<string, QueryValue> | URLSearchParams;

export type PaginationMeta = {
  current_page: number;
  from: number | null;
  last_page: number;
  path: string;
  per_page: number;
  to: number | null;
  total: number;
};

export type ApiResponse<T> = {
  data: T;
  meta?: PaginationMeta;
};

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function joinBaseAndPath(base: string, endpoint: string): string {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${normalizeBaseUrl(base)}${path}`;
}

function appendQuery(url: URL, query?: QueryParameters): void {
  if (query === undefined) return;
  if (query instanceof URLSearchParams) {
    query.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
    return;
  }
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    url.searchParams.append(key, String(value));
  }
}

function defaultHeaders(body: unknown): Headers {
  const headers = new Headers();
  headers.set('Accept', 'application/json');
  if (body !== undefined && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

function mergeHeaders(base: Headers, init?: RequestInit): Headers {
  const merged = new Headers(base);
  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => merged.set(key, value));
  }
  return merged;
}

function serializeBody(body: unknown): BodyInit | undefined {
  if (body === undefined) return undefined;
  if (body instanceof FormData || typeof body === 'string') return body;
  return JSON.stringify(body);
}

async function applyBearerFromCookies(headers: Headers): Promise<Headers> {
  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function errorMessageFromPayload(payload: unknown, status: number): string {
  if (
    payload &&
    typeof payload === 'object' &&
    'message' in payload &&
    typeof (payload as { message: unknown }).message === 'string'
  ) {
    return (payload as { message: string }).message;
  }
  return `HTTP ${status}`;
}

function toApiResponse<T>(payload: unknown): ApiResponse<T> {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload as ApiResponse<T>;
  }
  return { data: payload as T };
}

export class Api {
  private readonly fullUrl: string;

  constructor(endpoint: string) {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) {
      throw new Error('NEXT_PUBLIC_API_URL is not defined');
    }
    this.fullUrl = joinBaseAndPath(base, endpoint);
  }

  private resolveUrl(query?: QueryParameters): string {
    const url = new URL(this.fullUrl);
    appendQuery(url, query);
    return url.toString();
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    options: { query?: QueryParameters; body?: unknown; init?: RequestInit },
  ): Promise<ApiResponse<T>> {
    const { query, body, init } = options;
    const urlUsesQuery = method === 'GET' || method === 'DELETE';
    const headerSourceBody = urlUsesQuery ? undefined : body;
    const headers = await applyBearerFromCookies(
      mergeHeaders(defaultHeaders(headerSourceBody), init),
    );

    const fetchInit: RequestInit = {
      ...init,
      method,
      headers,
    };

    if (!urlUsesQuery && body !== undefined) {
      fetchInit.body = serializeBody(body);
    }

    const res = await fetch(
      this.resolveUrl(urlUsesQuery ? query : undefined),
      fetchInit,
    );
    const payload = await parseBody(res);
    if (!res.ok) {
      throw new ApiError(
        errorMessageFromPayload(payload, res.status),
        res.status,
        payload,
      );
    }
    return toApiResponse<T>(payload);
  }

  get<T = unknown>(
    queryParameters?: QueryParameters,
    init?: RequestInit,
  ): Promise<ApiResponse<T>> {
    return this.request<T>('GET', { query: queryParameters, init });
  }

  post<T = unknown>(body?: unknown, init?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>('POST', { body, init });
  }

  put<T = unknown>(body?: unknown, init?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', { body, init });
  }

  patch<T = unknown>(body?: unknown, init?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', { body, init });
  }

  delete<T = unknown>(
    queryParameters?: QueryParameters,
    init?: RequestInit,
  ): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', { query: queryParameters, init });
  }
}
