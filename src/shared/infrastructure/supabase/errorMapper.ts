import { AppError, AppErrorCode } from '@/shared/domain/errors'

/** Mensajes de login traducidos. La UI no debe ver el texto original en ingles. */
const authMessages: Record<string, string> = {
  'Invalid login credentials': 'Email o contraseña incorrectos',
  'Email not confirmed': 'Por favor confirma tu email',
  'User not found': 'Usuario no encontrado',
  'Email rate limit exceeded': 'Demasiados intentos, intenta más tarde',
}

/** Traduce un error de Supabase Auth a AppError. */
export function mapAuthError(error: { message: string; status?: number }): AppError {
  const message = authMessages[error.message]
  if (message) {
    return new AppError(AppErrorCode.UNAUTHORIZED, message, error)
  }
  if (error.status === 429) {
    return new AppError(AppErrorCode.UNAUTHORIZED, 'Demasiados intentos, intenta más tarde', error)
  }
  return new AppError(AppErrorCode.UNKNOWN, 'Error al iniciar sesión. Intenta nuevamente.', error)
}

/**
 * Traduce un error de PostgREST a AppError.
 *
 * Los codigos son de PostgREST/Postgres; que esta traduccion viva aqui, y solo
 * aqui, es justo lo que permite cambiar de backend sin tocar la UI.
 */
export function mapDataError(error: { code?: string; message: string }): AppError {
  switch (error.code) {
    case 'PGRST116': // 0 filas con .single()
      return new AppError(AppErrorCode.NOT_FOUND, 'No se encontró el recurso', error)
    case '42501': // insufficient_privilege: normalmente una politica RLS
      return new AppError(AppErrorCode.FORBIDDEN, 'No tienes permiso para esta operación', error)
    case '23505': // unique_violation
      return new AppError(AppErrorCode.CONFLICT, 'El registro ya existe', error)
    case '23503': // foreign_key_violation
      return new AppError(AppErrorCode.VALIDATION, 'Referencia inválida', error)
    default:
      return new AppError(AppErrorCode.UNKNOWN, 'Error al acceder a los datos', error)
  }
}
