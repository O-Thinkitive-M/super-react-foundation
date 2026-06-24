// The route tree. URL is the source of truth — every screen is refresh-safe and
// deep-linkable. Pages are v7 lazy route modules (each exports `Component`).
// Add a feature: add a path to paths.ts + a child below. See project-setup/routing.md.
import { createBrowserRouter, Navigate } from "react-router-dom";
import RootLayout from "./RootLayout";
import AppLayout from "./AppLayout";
import RouteError from "./RouteError";
import { RequireAuth } from "./guards";
import { paths } from "./paths";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      // public routes go here, e.g.
      // { path: "login", lazy: () => import("@/features/auth/pages/LoginPage") },

      // authenticated (nested under the guard + app chrome)
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { index: true, element: <Navigate to={paths.dashboard} replace /> },
              // DEMO route — replace with your first feature, then delete features/_demo.
              { path: "dashboard", lazy: () => import("@/features/_demo/pages/DashboardPage") },
            ],
          },
        ],
      },

      // 404 catch-all — keep last.
      { path: "*", element: <RouteError /> },
    ],
  },
]);
