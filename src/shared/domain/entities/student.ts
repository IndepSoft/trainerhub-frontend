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
  /**
   * La cuenta con la que el alumno entra, o `null` si todavía no tiene.
   *
   * Es lo que hará posible que el estudiante vea su propio progreso. `null` es
   * el caso corriente y no una carencia: el entrenador da de alta a alguien con
   * su nombre y su correo mucho antes —o en vez— de que esa persona se registre.
   *
   * El enlace se hace POR EMAIL al darse de alta: quien se registre con un correo
   * que ya está en la ficha de un alumno, pasa a ser ese alumno. No hace falta
   * inventar tokens de invitación para el caso normal.
   *
   * NO se guarda aquí ningún rol. El rol se deriva de quién te conoce —si te
   * encuentra `trainers.findByProfileId` eres entrenador, si te encuentra
   * `students.findByProfileId` eres alumno—, porque un rol guardado en el propio
   * usuario es un rol que el usuario puede cambiarse. Está razonado en
   * `docs/CAMBIOS-Y-ARQUITECTURA.md` §5.
   */
  profileId: string | null
}
