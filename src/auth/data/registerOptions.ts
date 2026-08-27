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
 * TODO: revisar esta lista con producto. Son una propuesta razonable, no una
 * decision tomada.
 */
export const TRAINER_SPECIALTIES: string[] = [
  'Entrenamiento de fuerza',
  'Pérdida de peso',
  'Acondicionamiento físico',
  'Preparación deportiva',
  'Rehabilitación y readaptación',
  'Nutrición deportiva',
  'Entrenamiento funcional',
  'Yoga y movilidad',
]

export const EXPERIENCE_RANGES: string[] = [
  '0-1 años',
  '1-3 años',
  '3-5 años',
  '5-10 años',
  'Más de 10 años',
]
