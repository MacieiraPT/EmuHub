import type { AppError, Result } from '@shared/types'

/** The bridge exposed by the preload script. */
export const bridge = window.emuhub

export class ApiError extends Error {
  readonly code: AppError['code']
  readonly hint: string | undefined

  constructor(error: AppError) {
    super(error.message)
    this.name = 'ApiError'
    this.code = error.code
    this.hint = error.hint
  }
}

/** Unwraps a Result, turning a failure into a throw with a readable message. */
export async function unwrap<T>(promise: Promise<Result<T>>): Promise<T> {
  const result = await promise
  if (result.ok) return result.data
  throw new ApiError(result.error)
}

/** Runs a call and hands back either the value or a presentable error. */
export async function attempt<T>(promise: Promise<Result<T>>): Promise<
  { ok: true; data: T } | { ok: false; error: AppError }
> {
  try {
    return { ok: true, data: await unwrap(promise) }
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, error: { code: error.code, message: error.message, ...(error.hint ? { hint: error.hint } : {}) } }
    }
    return {
      ok: false,
      error: { code: 'unknown', message: 'Something went wrong. Please try again.' }
    }
  }
}

export function describeError(error: unknown): { message: string; hint?: string } {
  if (error instanceof ApiError) {
    return error.hint ? { message: error.message, hint: error.hint } : { message: error.message }
  }
  if (error instanceof Error && error.message) return { message: error.message }
  return { message: 'Something went wrong. Please try again.' }
}
