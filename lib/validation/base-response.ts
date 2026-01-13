/**
 * Standardized response helpers for server APIs
 * Keep this file server-only; do not import from client code.
 */
export type SuccessResponse<T> = {
  success: true
  data: T
}

export type ErrorResponse = {
  success: false
  error: string | Record<string, any>
}

export type BaseResponse<T> = SuccessResponse<T> | ErrorResponse

export function successResponse<T>(data: T): SuccessResponse<T> {
  return { success: true, data }
}

export function errorResponse(error: string | Record<string, any>): ErrorResponse {
  return { success: false, error }
}

// Usage pattern (server-only):
// return NextResponse.json(successResponse(payload), { status: 200 })
