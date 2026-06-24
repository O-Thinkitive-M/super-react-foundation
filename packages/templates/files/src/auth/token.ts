// Token access for the HTTP client. DEMO STUBS — wire these to your real auth
// (store / httpOnly cookie). `getToken` returns the current access token;
// `refreshToken` performs a single-flight refresh and returns whether it
// succeeded. See project-setup/authentication.md.
export function getToken(): string | null {
  return null; // DEMO — return the current access token
}

export async function refreshToken(): Promise<boolean> {
  return false; // DEMO — perform refresh, return success; share one in-flight promise
}
