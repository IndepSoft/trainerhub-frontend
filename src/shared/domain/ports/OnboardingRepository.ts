/**
 * Puerto del recorrido de bienvenida: si quien ha entrado ya lo vio.
 *
 * PUERTO PROPIO Y PEQUEÑO, por segregación de interfaces: es un dato de la
 * CUENTA —lo vio esta persona, en el dispositivo que fuera— y no de la ficha de
 * entrenador ni de la de alumno. Colgarlo de `TrainerRepository` habría dejado
 * sin onboarding a los alumnos, y de `AuthPort` habría metido una preferencia
 * en el puerto de identidad.
 *
 * Vivía en `localStorage`, que es del navegador: quien entraba desde otro
 * teléfono volvía a verlo, y quien compartía tableta no lo veía nunca.
 */
export interface OnboardingRepository {
  /** `true` si quien ha entrado ya lo terminó. Sin sesión, `false`. */
  hasSeen(): Promise<boolean>
  /** Quien ha entrado acaba de terminarlo. Idempotente. */
  markSeen(): Promise<void>
}
