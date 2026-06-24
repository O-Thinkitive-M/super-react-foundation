// The single typed HTTP client. Owns baseURL, auth header injection, JSON
// (de)serialization, refresh-on-401, and typed ApiError. Components never call
// fetch directly — they consume per-domain hooks that call this. To switch to a
// generated SDK, run setup with --sdk. See project-setup/api-strategy.md.
import { normalizeError } from "@/api/errors";
import { getToken, refreshToken } from "@/auth/token";

const baseURL = import.meta.env.VITE_API_URL as string;

type Json = Record<string, unknown> | unknown[];

async function request<T>(
  path: string,
  init: RequestInit & { json?: Json } = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`); // auth injection

  let body = init.body;
  if (init.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(init.json);
  }

  const res = await fetch(`${baseURL}${path}`, { ...init, headers, body });

  // refresh-on-401 once (the retry flag guards infinite loops)
  if (res.status === 401 && retry && (await refreshToken())) {
    return request<T>(path, init, false);
  }

  if (!res.ok) throw await normalizeError(res); // typed ApiError
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T; // typed response
}

export const client = {
  get: <T>(p: string, init?: RequestInit) => request<T>(p, { ...init, method: "GET" }),
  post: <T>(p: string, json?: Json, init?: RequestInit) =>
    request<T>(p, { ...init, method: "POST", json }),
  put: <T>(p: string, json?: Json, init?: RequestInit) =>
    request<T>(p, { ...init, method: "PUT", json }),
  patch: <T>(p: string, json?: Json, init?: RequestInit) =>
    request<T>(p, { ...init, method: "PATCH", json }),
  del: <T>(p: string, init?: RequestInit) => request<T>(p, { ...init, method: "DELETE" }),
};
