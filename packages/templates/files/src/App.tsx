// App root — mounts the router. The screens themselves live behind the routes in
// src/router/. Keep this thin; app-wide providers belong in main.tsx.
import { RouterProvider } from "react-router-dom";
import { router } from "@/router/router";

export function App() {
  return <RouterProvider router={router} />;
}
