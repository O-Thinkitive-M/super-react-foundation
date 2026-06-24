// One typed error shape for the whole app. Every non-2xx / network failure is
// normalized to ApiError so hooks and components can catch a known shape.
// See project-setup/api-strategy.md.
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string, // machine-readable, e.g. 'VALIDATION'
    message: string,
    public details?: unknown, // field errors, trace id, etc.
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ErrorPayload {
  code?: string;
  message?: string;
  details?: unknown;
}

export async function normalizeError(res: Response): Promise<ApiError> {
  let payload: ErrorPayload | null = null;
  try {
    payload = (await res.json()) as ErrorPayload;
  } catch {
    /* non-JSON body */
  }
  return new ApiError(
    res.status,
    payload?.code ?? `HTTP_${res.status}`,
    payload?.message ?? res.statusText ?? "Request failed",
    payload?.details,
  );
}
