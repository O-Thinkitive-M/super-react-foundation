// Auth access point — the one place the rest of the app asks "who is the user?".
//
// DEMO STUB: returns a signed-in user so the scaffolded app renders end-to-end.
// Replace `useAuth` with your real implementation (context/store reading a token)
// and the route guards in src/router/guards.tsx start enforcing automatically —
// no route-tree changes needed. See project-setup/authentication.md.
export interface AuthUser {
  id: string;
  name: string;
  roles: string[];
}

export function useAuth(): { user: AuthUser | null } {
  // DEMO — replace with real auth state.
  return { user: { id: "demo", name: "Demo User", roles: ["admin"] } };
}
