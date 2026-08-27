/**
 * Entidades del dominio de estudiantes.
 *
 * Antes `Student` se declaraba dentro de `StudentCard`, atado al componente que
 * lo pinta. Aquí es del dominio, y cualquier otra vista puede usarlo sin
 * arrastrar los props de esa tarjeta.
 *
 * Se guardan `firstName` y `lastName` por separado, y no un `name` único, por
 * dos motivos: es como ya modela `Trainer` en `shared/domain/entities`, y es lo
 * que necesitan `getInitials` y `getShortName` de `shared/utils/nameHelpers`.
 */

export type StudentLevel = 'Principiante' | 'Intermedio' | 'Avanzado'

export interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  level: StudentLevel
  goals: string[]
  age: number
  bodyFatPercentage: number
  photoUrl?: string
}
