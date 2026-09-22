import type { TranslationKey } from '@/shared/i18n/dictionaries/es'
import { SECTION_PARAM } from '@/shared/hooks/useUrlSection'

/**
 * Las secciones de la ficha, en el orden en que se leen.
 *
 * Primero lo que se pregunta al abrir una ficha —cómo está y qué le toca—, y
 * después el detalle de cada cosa. La cuota cierra: se consulta cuando toca
 * cobrar, no cada vez que se entra.
 */
export const STUDENT_SECTIONS = ['resumen', 'progreso', 'sesiones', 'cuota'] as const

export type StudentSection = (typeof STUDENT_SECTIONS)[number]

/**
 * Las secciones que quedan cuando el resumen deja de ser una de ellas.
 *
 * En ancho el resumen es la columna de identidad —siempre a la vista— y las
 * pestañas cubren sólo el detalle. Se escriben, no se derivan con `slice`:
 * derivarlas daba un tipo sin primer elemento garantizado y obligaba a un
 * `as` de conveniencia. Van al lado de `STUDENT_SECTIONS` para que las dos
 * listas se lean juntas.
 */
export const DETAIL_SECTIONS = ['progreso', 'sesiones', 'cuota'] as const

/** El parámetro que abre el diálogo de agendar al entrar. */
export const SCHEDULE_PARAM = 'agendar'

export const STUDENT_SECTION_LABEL_KEY: Record<StudentSection, TranslationKey> = {
  resumen: 'studentSection.summary',
  progreso: 'studentSection.progress',
  sesiones: 'studentSection.sessions',
  cuota: 'studentSection.dues',
}

export function isStudentSection(value: string | null): value is StudentSection {
  return STUDENT_SECTIONS.some((section) => section === value)
}

/** La dirección, relativa a la ficha, que abre una sección. */
export function sectionHref(section: StudentSection): string {
  // La primera no lleva parámetro: es con la que se abre la ficha.
  return section === STUDENT_SECTIONS[0] ? '?' : `?${SECTION_PARAM}=${section}`
}
