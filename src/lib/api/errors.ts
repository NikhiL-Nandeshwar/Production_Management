export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
    public fields: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
export function safeMessage(
  value: unknown,
  fallback = 'The request could not be completed. Please try again.',
) {
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    value.length > 350 ||
    /stack|exception|\bat\s+[\w.]+\(|sqlclient|connection string|password=|token=/i.test(
      value,
    )
  )
    return fallback;
  return value;
}
export const errorText = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : 'Something went wrong. Please try again.';
