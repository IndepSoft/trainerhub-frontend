import type { TranslationKey } from '@/shared/i18n/dictionaries/es'

/**
 * Opciones de los desplegables del registro.
 *
 * Estaban declaradas dentro de `RegisterForm`, que asi cargaba tambien con ser
 * su propia fuente de datos.
 *
 * ATENCION: la lista anterior de especialidades era de desarrollo de software
 * -"Desarrollo Web", "Data Science", "DevOps", "Machine Learning",
 * "Cybersecurity"- en un formulario de alta de entrenadores. Venia copiada de
 * otro proyecto. Se sustituye por especialidades de entrenamiento personal.
 *
 * SON CLAVES, no textos: la lista se evalua al importar, donde no hay contexto
 * del que sacar el idioma. Traduce el formulario, que es quien las pinta.
 *
 * TODO: revisar esta lista con producto. Son una propuesta razonable, no una
 * decision tomada.
 */
export const TRAINER_SPECIALTY_KEYS: TranslationKey[] = [
  'specialty.strength',
  'specialty.weightLoss',
  'specialty.conditioning',
  'specialty.sports',
  'specialty.rehab',
  'specialty.nutrition',
  'specialty.functional',
  'specialty.yoga',
]

/*
 * El rango de experiencia se guarda como NUMERO: `useRegisterForm` le hace un
 * `parseInt`, que se queda con la cifra de la izquierda. Por eso toda traduccion
 * de estas etiquetas tiene que empezar por el numero -«0-1 years», nunca «less
 * than a year»-, o el dato que se guarda deja de ser el que se eligio.
 */
export const EXPERIENCE_RANGE_KEYS: TranslationKey[] = [
  'experience.0to1',
  'experience.1to3',
  'experience.3to5',
  'experience.5to10',
  'experience.over10',
]
