// Centralized React Query key factory — one source of truth for cache keys so
// invalidation is consistent. Add a per-domain entry as you add domains.
// Example domain ("example") shown; replace with your real domains.
// See project-setup/api-strategy.md.
export const keys = {
  example: {
    all: ["example"] as const,
    list: () => [...keys.example.all, "list"] as const,
    detail: (id: string) => [...keys.example.all, "detail", id] as const,
  },
} as const;
