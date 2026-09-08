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

/**
 * POR QUE fallo, en vocabulario del dominio.
 *
 * ERA UN TEXTO EN CASTELLANO. `AppError.message` llegaba tal cual a la pantalla
 * -«Email o contraseña incorrectos»-, y con la aplicacion en tres idiomas quien
 * la usaba en ingles recibia el error en castellano. El dominio no puede conocer
 * el diccionario, asi que aqui viaja el MOTIVO y quien pinta lo traduce con
 * `describeError`, en `shared/i18n`. Es el mismo reparto que los rotulos de rol:
 * el dominio dice que es, la presentacion dice como se llama.
 *
 * `message` se conserva como texto para registros y consolas, nunca para la
 * interfaz.
 */
export type AppErrorReason =
  | 'invalidCredentials'
  | 'emailNotConfirmed'
  | 'userNotFound'
  | 'tooManyAttempts'
  | 'signInFailed'
  | 'signOutFailed'
  | 'userDataUnavailable'
  | 'accountNotCreated'
  | 'invalidEmailFormat'
  | 'passwordTooShort'
  | 'emailTaken'
  | 'notFound'
  | 'forbidden'
  | 'alreadyExists'
  | 'invalidReference'
  | 'dataAccessFailed'
  | 'noActiveCrew'
  | 'lastAdmin'
  | 'personNotInAnyCrew'
  | 'accountNotClaimed'
  | 'enrollmentClosed'
  | 'samePassword'
  | 'sessionExpired'

/** Valores que el mensaje del motivo necesita para rellenar sus huecos. */
export type AppErrorValues = Record<string, string | number>

export class AppError extends Error {
  readonly code: AppErrorCode
  readonly reason: AppErrorReason
  readonly values?: AppErrorValues
  /** Error original del proveedor. Solo para logging/debug, nunca para la UI. */
  readonly cause?: unknown

  constructor(code: AppErrorCode, reason: AppErrorReason, cause?: unknown, values?: AppErrorValues) {
    super(reason)
    this.name = 'AppError'
    this.code = code
    this.reason = reason
    this.values = values
    this.cause = cause
  }

  static is(error: unknown): error is AppError {
    return error instanceof AppError
  }
}
