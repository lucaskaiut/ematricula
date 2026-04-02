import md5 from 'md5';

export const URL_ENCODED_STATE_KEY = 'st';

export function stableStringifyForUrlState(value: unknown): string {
  return JSON.stringify(sortObjectKeysDeep(value));
}

function sortObjectKeysDeep(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sortObjectKeysDeep);
  const obj = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = sortObjectKeysDeep(obj[key]);
  }
  return sorted;
}

function utf8ToBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  const b64 = btoa(binary);
  return b64.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function base64UrlToUtf8(encoded: string): string | null {
  try {
    let b64 = encoded.replaceAll('-', '+').replaceAll('_', '/');
    const pad = b64.length % 4;
    if (pad) b64 += '='.repeat(4 - pad);
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

export function encodeUrlStatePayload(data: unknown): string {
  const json = stableStringifyForUrlState(data);
  const checksum = md5(json);
  const body = utf8ToBase64Url(json);
  return `${body}~${checksum}`;
}

export function decodeUrlStatePayload<T>(encoded: string): T | null {
  const sep = encoded.lastIndexOf('~');
  if (sep <= 0) return null;
  const body = encoded.slice(0, sep);
  const checksum = encoded.slice(sep + 1).toLowerCase();
  if (!/^[a-f0-9]{32}$/.test(checksum)) return null;
  const json = base64UrlToUtf8(body);
  if (!json) return null;
  if (md5(json).toLowerCase() !== checksum) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function buildPathWithEncodedState(
  pathname: string,
  encodedPayload: string | null,
  preserveParams?: URLSearchParams,
): string {
  const params = new URLSearchParams();
  if (preserveParams) {
    preserveParams.forEach((value, key) => {
      if (key === URL_ENCODED_STATE_KEY) return;
      params.append(key, value);
    });
  }
  if (encodedPayload) params.set(URL_ENCODED_STATE_KEY, encodedPayload);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
