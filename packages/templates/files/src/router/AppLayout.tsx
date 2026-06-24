// Authenticated shell — sidebar/header chrome + a <Suspense> boundary around the
// <Outlet/> so each lazy route chunk resolves gracefully. Sits under RequireAuth.
// Add your real sidebar/topbar here when features exist. See project-setup/routing.md.
import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";

export default function AppLayout() {
  return (
    <Box sx={{ display: "flex", minHeight: "100dvh" }}>
      {/* <Sidebar /> goes here once features exist */}
      <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </Box>
    </Box>
  );
}
