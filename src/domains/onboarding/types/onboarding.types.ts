import type { LucideIcon } from 'lucide-react'

/**
 * Entidades del onboarding.
 *
 * Cada paso es contenido, no configuración de presentación: no lleva clases
 * CSS. La forma la decide el componente, que es la leccion aprendida de
 * `ProgressStat`, donde el color de Tailwind vivia dentro del dato.
 */
export interface OnboardingStep {
  id: string
  /** Palabra corta sobre el titular. Va en Ember. */
  eyebrow: string
  /** Titular. Se parte en lineas a proposito para controlar el corte. */
  headline: string[]
  body: string
  icon: LucideIcon
}
