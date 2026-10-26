// Reading the service's errors (spec section 4). Screens decide what to say from the
// status and code, and never show the service's own message text.
import type { ApiErrorBody } from '@/types/api'

type ErrorWithStatus = { status: number | string; data?: unknown }

function hasStatus(error: unknown): error is ErrorWithStatus {
  return typeof error === 'object' && error !== null && 'status' in error
}

function body(error: unknown): Partial<ApiErrorBody> {
  if (!hasStatus(error) || typeof error.data !== 'object' || error.data === null) return {}
  return error.data as Partial<ApiErrorBody>
}

// 400, 401, 403, 404, 409, 500; or a string such as "FETCH_ERROR" when the service
// couldn't be reached at all.
export function errorStatus(error: unknown): number | string | undefined {
  return hasStatus(error) ? error.status : undefined
}

// e.g. "LISTING_EXPIRED", "LISTING_ALREADY_RESERVED".
export function errorCode(error: unknown): string | undefined {
  return body(error).code
}

// Field name to message on a 400.
export function fieldErrors(error: unknown): Record<string, string> {
  return body(error).fields ?? {}
}
