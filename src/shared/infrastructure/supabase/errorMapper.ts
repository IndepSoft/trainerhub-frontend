import { AppError, AppErrorCode, type AppErrorReason } from '@/shared/domain/errors'

/**
 * De lo que dice Supabase Auth a un motivo del dominio.
 *
 * ERAN MENSAJES EN CASTELLANO. La UI los pintaba tal cual y en ingles seguian
 * saliendo en castellano. Ahora aqui solo se decide el MOTIVO; el texto lo pone
 * `describeError` en el idioma que toque.
 */
const AUTH_REASONS: Record<string, AppErrorReason> = {
  'Invalid login credentials': 'invalidCredentials',
  'Email not confirmed': 'emailNotConfirmed',
  'User not found': 'userNotFound',
  'Email rate limit exceeded': 'tooManyAttempts',
  'User already registered': 'emailTaken',
  'New password should be different from the old password.': 'samePassword',
  'Auth session missing!': 'sessionExpired',
}

/** Traduce un error de Supabase Auth a AppError. */
export function mapAuthError(error: { message: string; status?: number }): AppError {
  const reason = AUTH_REASONS[error.message]
  if (reason !== undefined) {
    return new AppError(AppErrorCode.UNAUTHORIZED, reason, error)
  }
  if (error.status === 429) {
    return new AppError(AppErrorCode.UNAUTHORIZED, 'tooManyAttempts', error)
  }
  return new AppError(AppErrorCode.UNKNOWN, 'signInFailed', error)
}

/**
 * Traduce un error de PostgREST a AppError.
 *
 * Los codigos son de PostgREST/Postgres; que esta traduccion viva aqui, y solo
 * aqui, es justo lo que permite cambiar de backend sin tocar la UI.
 */
/**
 * Lo que el servidor levanta A PROPOSITO, con el motivo como mensaje.
 *
 * Un disparador o una funcion de Postgres que rechaza algo -«el ultimo
 * administrador no se va»- hace `raise exception 'lastAdmin'`: el mensaje ES
 * el motivo, tal cual lo conoce `AppError`, y aqui se reconoce antes de mirar
 * el codigo SQL. Asi la regla vive en el servidor y la pantalla la traduce
 * igual que si la hubiera levantado el adaptador simulado.
 */
const SERVER_REASONS: Partial<Record<string, [AppErrorCode, AppErrorReason]>> = {
  lastAdmin: [AppErrorCode.VALIDATION, 'lastAdmin'],
  forbidden: [AppErrorCode.FORBIDDEN, 'forbidden'],
  noActiveCrew: [AppErrorCode.VALIDATION, 'noActiveCrew'],
  accountNotClaimed: [AppErrorCode.VALIDATION, 'accountNotClaimed'],
  personNotInAnyCrew: [AppErrorCode.NOT_FOUND, 'personNotInAnyCrew'],
  enrollmentClosed: [AppErrorCode.VALIDATION, 'enrollmentClosed'],
  notFound: [AppErrorCode.NOT_FOUND, 'notFound'],
}

export function mapDataError(error: { code?: string; message: string }): AppError {
  const raised = SERVER_REASONS[error.message]
  if (raised !== undefined) return new AppError(raised[0], raised[1], error)

  switch (error.code) {
    case 'PGRST116': // 0 filas con .single()
      return new AppError(AppErrorCode.NOT_FOUND, 'notFound', error)
    case '42501': // insufficient_privilege: normalmente una politica RLS
      return new AppError(AppErrorCode.FORBIDDEN, 'forbidden', error)
    case '23505': // unique_violation
      return new AppError(AppErrorCode.CONFLICT, 'alreadyExists', error)
    case '23503': // foreign_key_violation
      return new AppError(AppErrorCode.VALIDATION, 'invalidReference', error)
    default:
      return new AppError(AppErrorCode.UNKNOWN, 'dataAccessFailed', error)
  }
}
