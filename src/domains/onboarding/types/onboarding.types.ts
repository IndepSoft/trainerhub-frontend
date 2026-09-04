import type { LucideIcon } from 'lucide-react'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'

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
  eyebrowKey: TranslationKey
  /**
   * Titular, una clave por linea.
   *
   * Se parte a proposito: donde corta una frase es una decision de composicion,
   * y una sola cadena partida por espacios se rompe en cuanto un idioma use
   * otro numero de palabras.
   */
  headlineKeys: TranslationKey[]
  bodyKey: TranslationKey
  icon: LucideIcon
}
