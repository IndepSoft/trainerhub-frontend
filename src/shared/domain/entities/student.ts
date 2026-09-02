import type { MembershipStatus } from './crew'
import type { Capability } from '../permissions'

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
  /**
   * El crew al que pertenece esta ficha.
   *
   * LA FICHA ES LA PERTENENCIA. No hay una tabla de miembros aparte para los
   * alumnos, y es deliberado: la ficha ya ES la relación entre un entrenador y
   * un alumno, y desdoblarla obligaría a mantener dos filas sincronizadas para
   * decir lo mismo.
   *
   * Un alumno en dos crews tiene DOS fichas, una por crew. Suena a duplicación y
   * no lo es: la ficha es la libreta privada de un entrenador —edad, grasa,
   * objetivos, notas—, y las notas de su entrenador de crossfit no son asunto
   * de su club de running. La separación por crew sale gratis, por construcción.
   * Lo que comparten las dos fichas es `profileId`: la persona.
   */
  crewId: string
  firstName: string
  lastName: string
  email: string
  level: StudentLevel
  goals: string[]
  age: number
  bodyFatPercentage: number
  photoUrl?: string
  /**
   * Concesiones por encima de su rol.
   *
   * Un alumno no gestiona nada de serie, así que esto normalmente está vacío.
   * Existe para el caso real del veterano al que se le deja publicar en el muro
   * sin convertirlo en entrenador: darle la llave suelta es más pequeño —y más
   * fácil de retirar— que un ascenso.
   */
  extraCapabilities: Capability[]
  /**
   * En qué punto está su pertenencia a este crew.
   *
   * `invited` cuando la ficha la creó el entrenador y espera a que su dueño se
   * registre; `pending` cuando alguien escaneó el QR y falta el visto bueno;
   * `active` cuando ya entrena.
   */
  membershipStatus: MembershipStatus
  /**
   * La cuenta con la que el alumno entra, o `null` si todavía no tiene.
   *
   * Es lo que hace posible que el estudiante vea su propio progreso. `null` es
   * el caso corriente y no una carencia: el entrenador da de alta a alguien con
   * su nombre y su correo mucho antes —o en vez— de que esa persona se registre.
   *
   * HAY DOS FORMAS DE RECLAMAR UNA FICHA, y son la misma operación con distinto
   * envoltorio: por CORREO —quien se registra con un correo que ya está en una
   * ficha, pasa a ser ese alumno— o por QR —quien escanea el token del crew crea
   * la suya—. Por eso el dominio tiene una sola operación de reclamación y no
   * dos flujos paralelos que mantener.
   *
   * NO se guarda aquí ningún rol. El rol se deriva de quién te conoce —si te
   * encuentra `crews.findTrainerProfile` eres entrenador, si te encuentran las
   * fichas de alumno eres alumno—, porque un rol guardado en el propio usuario
   * es un rol que el usuario puede cambiarse. Está razonado en
   * `docs/CAMBIOS-Y-ARQUITECTURA.md` §5.
   */
  profileId: string | null
}
