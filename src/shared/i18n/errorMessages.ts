import { AppError, type AppErrorReason } from '@/shared/domain/errors'
import type { TranslationKey } from './dictionaries/es'
import type { Translate } from './LanguageContext'

/**
 * Como se llama en pantalla cada motivo de error.
 *
 * Vive aqui y no en `shared/domain/errors.ts` por lo mismo que los rotulos de
 * rol: el dominio no conoce el diccionario. `AppError` dice POR QUE fallo, y
 * esta tabla dice como se cuenta en cada idioma.
 */
export const ERROR_REASON_KEY: Record<AppErrorReason, TranslationKey> = {
  invalidCredentials: 'error.invalidCredentials',
  emailNotConfirmed: 'error.emailNotConfirmed',
  userNotFound: 'error.userNotFound',
  tooManyAttempts: 'error.tooManyAttempts',
  signInFailed: 'error.signInFailed',
  signOutFailed: 'error.signOutFailed',
  userDataUnavailable: 'error.userDataUnavailable',
  accountNotCreated: 'error.accountNotCreated',
  invalidEmailFormat: 'error.invalidEmailFormat',
  passwordTooShort: 'error.passwordTooShort',
  emailTaken: 'error.emailTaken',
  notFound: 'error.notFound',
  forbidden: 'error.forbidden',
  alreadyExists: 'error.alreadyExists',
  invalidReference: 'error.invalidReference',
  dataAccessFailed: 'error.dataAccessFailed',
  noActiveCrew: 'error.noActiveCrew',
  lastAdmin: 'error.lastAdmin',
  personNotInAnyCrew: 'error.personNotInAnyCrew',
  accountNotClaimed: 'error.accountNotClaimed',
  enrollmentClosed: 'error.enrollmentClosed',
  samePassword: 'error.samePassword',
  sessionExpired: 'error.sessionExpired',
}

/**
 * El texto con el que se cuenta un fallo.
 *
 * SUSTITUYE A VEINTE COPIAS de `AppError.is(x) ? x.message : t('...')`, una
 * por hook, que era donde se colaba el castellano a fuego. Un `AppError` se
 * traduce por su motivo; cualquier otra cosa -un `TypeError`, un fallo de red
 * sin traducir- se cuenta con el mensaje de reserva que cada pantalla elige,
 * porque el texto crudo de una excepcion no es para nadie que no este depurando.
 */
export function describeError(error: unknown, t: Translate, fallback: TranslationKey): string {
  if (AppError.is(error)) return t(ERROR_REASON_KEY[error.reason], error.values)
  return t(fallback)
}
