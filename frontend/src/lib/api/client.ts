import type { ApiErrorBody } from '@chat/contracts';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public field?: string,
  ) {
    super(message);
  }
}

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setToken = (value: string | null) => {
  token = value;
};

export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

const NETWORK_ERROR = 'Network error. Check your connection and try again.';

function toApiError(status: number, data: unknown, fallback: string): ApiError {
  const body = (data ?? {}) as Partial<ApiErrorBody>;
  const message = Array.isArray(body.message) ? body.message[0] : body.message;
  if (status === 401 && token) onUnauthorized?.();
  return new ApiError(status, message || fallback, body.field);
}

export async function api<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: init.method ?? 'GET',
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError(0, NETWORK_ERROR);
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw toApiError(res.status, data, res.statusText);
  return data as T;
}

export function upload<T>(
  path: string,
  form: FormData,
  onProgress?: (pct: number) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api${path}`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.responseType = 'json';
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response as T);
      else reject(toApiError(xhr.status, xhr.response, 'Upload failed'));
    };
    xhr.onerror = () => reject(new ApiError(0, NETWORK_ERROR));
    xhr.send(form);
  });
}

export const errorText = (err: unknown) =>
  err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
