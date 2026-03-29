import type { LaravelValidationError } from "@/types/api";

export type ApiClientConfig = {
  baseUrl: string;
  getToken?: () => string | undefined;
};

export type RequestOptions = Omit<RequestInit, "body" | "method"> & {
  body?: unknown;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get validation(): LaravelValidationError | null {
    if (
      this.payload &&
      typeof this.payload === "object" &&
      "errors" in (this.payload as object)
    ) {
      return this.payload as LaravelValidationError;
    }
    return null;
  }
}

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
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

export function createApiClient(config: ApiClientConfig) {
  const base = normalizeBaseUrl(config.baseUrl);

  async function request<T>(
    method: string,
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
    const headers = new Headers(options.headers);
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }
    if (options.body !== undefined && !(options.body instanceof FormData)) {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
    }
    const token = config.getToken?.();
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    const body =
      options.body === undefined || options.body instanceof FormData
        ? options.body
        : JSON.stringify(options.body);
    const { body: _b, ...rest } = options;
    const res = await fetch(url, {
      ...rest,
      method,
      headers,
      body: body as BodyInit | undefined,
    });
    const payload = await parseBody(res);
    if (!res.ok) {
      const msg =
        payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof (payload as { message: unknown }).message === "string"
          ? (payload as { message: string }).message
          : `HTTP ${res.status}`;
      throw new ApiError(msg, res.status, payload);
    }
    return payload as T;
  }

  return {
    get: <T>(path: string, options?: RequestOptions) =>
      request<T>("GET", path, options),
    post: <T>(path: string, options?: RequestOptions) =>
      request<T>("POST", path, options),
    put: <T>(path: string, options?: RequestOptions) =>
      request<T>("PUT", path, options),
    patch: <T>(path: string, options?: RequestOptions) =>
      request<T>("PATCH", path, options),
    delete: <T>(path: string, options?: RequestOptions) =>
      request<T>("DELETE", path, options),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
