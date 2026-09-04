/**
 * Identificadores de perfil deterministas para el entorno simulado.
 *
 * VIVE APARTE PORQUE LO USAN DOS. Lo tenía dentro `FakeAuthAdapter`, que deriva
 * el identificador del correo para que la misma persona conserve su `id` entre
 * recargas. En cuanto las semillas necesitaron referirse a ese mismo perfil —el
 * entrenador de desarrollo es el dueño del crew de ejemplo—, había dos
 * opciones: copiar el hash, o escribir el UUID resultante a mano en la semilla.
 *
 * Las dos se rompen en silencio el día que cambie la derivación: el crew de
 * ejemplo pasaría a ser de nadie y la aplicación arrancaría sin datos, sin que
 * nada avisara. Compartir la función lo hace imposible.
 */

/** El correo con el que se entra en desarrollo. Ver `docs/HANDOFF-SESION.md`. */
export const DEV_TRAINER_EMAIL = 'entrenador@indepsoft.com'

/**
 * Deriva un identificador estable a partir del correo.
 *
 * Con un valor aleatorio, cualquier dato asociado al usuario se perdería en cada
 * arranque. La forma imita a un UUID v4 para que nada de lo que lo consuma tenga
 * que tratarlo distinto del identificador real.
 */
export function profileIdFromEmail(emailAddress: string): string {
  let hash = 0
  for (let index = 0; index < emailAddress.length; index += 1) {
    hash = (hash << 5) - hash + emailAddress.charCodeAt(index)
    hash |= 0
  }
  const suffix = Math.abs(hash).toString(16).padStart(12, '0')
  return `00000000-0000-4000-8000-${suffix.slice(0, 12)}`
}

/** El perfil del entrenador de desarrollo, dueño del crew de ejemplo. */
export const DEV_TRAINER_PROFILE_ID = profileIdFromEmail(DEV_TRAINER_EMAIL)
