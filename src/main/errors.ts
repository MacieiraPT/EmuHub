import type { AppError, AppErrorCode, Result } from '@shared/types'

/** Error carrying a message that is safe to show to a user verbatim. */
export class UserFacingError extends Error {
  readonly code: AppErrorCode
  readonly hint: string | undefined

  constructor(code: AppErrorCode, message: string, hint?: string) {
    super(message)
    this.name = 'UserFacingError'
    this.code = code
    this.hint = hint
  }

  toAppError(): AppError {
    return this.hint ? { code: this.code, message: this.message, hint: this.hint } : { code: this.code, message: this.message }
  }
}

export function ok<T>(data: T): Result<T> {
  return { ok: true, data }
}

export function fail(code: AppErrorCode, message: string, hint?: string): Result<never> {
  return { ok: false, error: hint ? { code, message, hint } : { code, message } }
}

/**
 * Converts anything thrown inside a handler into a Result. Unknown failures are
 * logged with their stack for developers but reported to the user as a short,
 * readable sentence — stack traces never reach the interface.
 */
export function toResult(error: unknown, context: string): Result<never> {
  if (error instanceof UserFacingError) {
    return { ok: false, error: error.toAppError() }
  }

  const nodeError = error as NodeJS.ErrnoException
  switch (nodeError?.code) {
    case 'ENOENT':
      return fail('not-found', 'That file could not be found. It may have been moved or deleted.')
    case 'EACCES':
    case 'EPERM':
      return fail(
        'permission-denied',
        'EmuHub is not allowed to access that file.',
        'Check the file permissions, or pick a different location.'
      )
    case 'EISDIR':
      return fail('invalid-path', 'That is a folder, not an application file.')
    case 'ENOSPC':
      return fail('storage-failed', 'There is no free space left to save your configuration.')
    default:
      break
  }

  console.error(`[emuhub] ${context}:`, error)
  return fail('unknown', 'Something went wrong. Your configuration was not changed.', 'Please try again.')
}
