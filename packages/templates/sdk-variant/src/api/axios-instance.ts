// SDK transport — the ONE axios instance the generated SDK routes through
// (`customAxios` mutator). All auth, audit, PHI-safe logging, and 401 handling
// lives here. This replaces the hand-rolled src/api/client.ts when the project
// uses the SDK option. See project-setup/api-strategy.md.
import Axios, { type AxiosError, type AxiosRequestConfig } from "axios";

export const AXIOS_INSTANCE = Axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Pluggable token source. Default reads nothing; wire it to your auth store once
// auth exists: setAuthToken(() => useAuthStore.getState().token).
let getToken: () => string | null | undefined = () => undefined;
export function setAuthToken(getter: () => string | null | undefined): void {
  getToken = getter;
}

// Request: attach Bearer token (today from the getter; future: httpOnly cookie).
AXIOS_INSTANCE.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response: audit-log (no bodies) + PHI-safe error logging + 401 handling.
AXIOS_INSTANCE.interceptors.response.use(
  (res) => {
    audit({ method: res.config.method, url: res.config.url, status: res.status });
    return res;
  },
  (error: AxiosError) => {
    logPhiSafe(error); // strip request/response bodies before logging
    if (error.response?.status === 401) {
      window.location.assign("/login"); // future: silent refresh first
    }
    return Promise.reject(error);
  },
);

// Orval mutator: generic, returns `.data` so hooks get typed payloads directly.
// (httpClient: 'axios' in orval.config.ts depends on this.)
export const customAxios = <T>(config: AxiosRequestConfig): Promise<T> =>
  AXIOS_INSTANCE({ ...config }).then(({ data }) => data);

export default customAxios;

function audit(_e: unknown): void {
  /* POST to audit sink or buffer — no bodies */
}
function logPhiSafe(_e: unknown): void {
  /* console/Sentry with request/response bodies removed */
}
