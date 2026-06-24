// Route guards — layout-less wrapper routes. Each checks access and renders
// <Outlet/> when allowed or <Navigate/> when not. The demo `useAuth` returns a
// signed-in admin, so everything renders; swap it for real auth to enforce.
// See project-setup/routing.md.
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { paths } from "./paths";

export function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    // preserve where the user was headed so login can bounce them back
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

export function RequireRole({ role }: { role: string }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.roles.includes(role)) {
    return <Navigate to={paths.dashboard} replace />; // or a dedicated 403 page
  }
  return <Outlet />;
}
