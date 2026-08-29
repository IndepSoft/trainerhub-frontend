/**
 * Estudiante, en términos de la aplicación.
 *
 * Vive en `shared/domain` y no dentro del dominio `students` por el mismo
 * motivo que `Trainer`: lo necesitan DOS dominios. El calendario tiene que
 * poder ofrecer la lista de alumnos al agendar una sesión, y hacerlo importando
 * el hook de `students` acoplaba los dos dominios entre sí.
 *
 * Una entidad que cruza dominios pertenece a la capa compartida; si se queda
 * dentro de uno, el otro no tiene forma de usarla sin depender de él.
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
