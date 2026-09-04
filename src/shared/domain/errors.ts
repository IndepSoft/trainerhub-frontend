/**
 * Errores normalizados de la aplicacion.
 *
 * Ningun error de un proveedor concreto (PostgrestError, AuthError, un status
 * HTTP...) debe cruzar la frontera de infraestructura. Los adaptadores traducen
 * a AppError; hooks y componentes solo conocen esto.
 */

export const AppErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION: 'VALIDATION',
  NETWORK: 'NETWORK',
  UNKNOWN: 'UNKNOWN',
} as const

export type AppErrorCode = (typeof AppErrorCode)[keyof typeof AppErrorCode]

export class AppError extends Error {
  readonly code: AppErrorCode
  /** Error original del proveedor. Solo para logging/debug, nunca para la UI. */
  readonly cause?: unknown

  constructor(code: AppErrorCode, message: string, cause?: unknown) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.cause = cause
  }

  static is(error: unknown): error is AppError {
    return error instanceof AppError
  }
}
