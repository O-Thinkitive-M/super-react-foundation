// Root layout — sits at "/". Hosts app-wide chrome and the <Outlet/> for every
// route. The errorElement is attached here in router.tsx. Keep app-wide providers
// in main.tsx; keep this for layout/chrome. See project-setup/routing.md.
import { Outlet } from "react-router-dom";

export default function RootLayout() {
  return <Outlet />;
}
