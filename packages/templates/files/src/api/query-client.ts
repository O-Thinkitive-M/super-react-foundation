// Single source of truth for React Query defaults (staleTime / retry / focus).
// main.tsx passes this to <QueryClientProvider>. See project-setup/api-strategy.md.
import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/api/errors";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 min: avoid refetch storms
      gcTime: 5 * 60_000,
      // don't retry 4xx; retry 5xx up to twice
      retry: (count, err) => (err instanceof ApiError && err.status >= 500 ? count < 2 : false),
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});
