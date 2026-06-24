import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { QueryClientProvider } from "@tanstack/react-query";
import { theme } from "@/theme";
import { queryClient } from "@/api/query-client";
import { App } from "@/App";
import "@/i18n"; // initialize i18n (side-effect) before the app renders

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

createRoot(rootEl).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
