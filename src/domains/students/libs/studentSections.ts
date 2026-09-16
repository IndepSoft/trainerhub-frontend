import type { TranslationKey } from '@/shared/i18n/dictionaries/es'

/**
 * Las secciones de la ficha, en el orden en que se leen.
 *
 * Primero lo que se pregunta al abrir una ficha —cómo está y qué le toca—, y
 * después el detalle de cada cosa. La cuota cierra: se consulta cuando toca
 * cobrar, no cada vez que se entra.
 */
export const STUDENT_SECTIONS = ['resumen', 'progreso', 'sesiones', 'cuota'] as const

export type StudentSection = (typeof STUDENT_SECTIONS)[number]

/** La sección con la que se abre una ficha cuando la dirección no dice otra. */
export const DEFAULT_STUDENT_SECTION: StudentSection = 'resumen'

/**
 * El parámetro de la dirección que dice qué sección está abierta.
 *
 * En la URL y no en el estado del componente, por lo mismo que las pestañas de
 * Entrenamientos: `/students/x?seccion=cuota` se puede enlazar, y es como el
 * «Le toca» del resumen lleva a la sección donde se resuelve cada cosa.
 */
export const SECTION_PARAM = 'seccion'

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
  return section === DEFAULT_STUDENT_SECTION ? '?' : `?${SECTION_PARAM}=${section}`
}
