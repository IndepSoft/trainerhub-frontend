import type { CrewRole } from './entities/crew'

/**
 * Lo que se puede hacer dentro de un crew.
 *
 * DOS PODERES DISTINTOS, y hasta ahora estaban fundidos en «eres entrenador».
 * Entrenar es asignar rutinas, agendar, llevar fichas y hablarle al equipo.
 * Gobernar es decidir quién trabaja allí y cómo se llama la casa. En un
 * entrenador solo los tiene la misma persona; en un gimnasio, no: el dueño
 * gobierna —y puede no entrenar a nadie— y sus entrenadores entrenan sin poder
 * echarse entre ellos.
 *
 * Se nombran por lo que autorizan, no por la pantalla donde se usan: una
 * capacidad llamada `verBotonDeAgendar` se rompe el día que el botón se mueva.
 */
export type Capability =
  /** Cambiar nombre, denominación, aprobación de entradas y ranking. */
  | 'crew.settings'
  /** Añadir y quitar gente del equipo técnico. */
  | 'crew.staff'
  /** Enseñar el QR, rotarlo y dar de alta fichas. */
  | 'crew.invite'
  /** Aceptar o rechazar solicitudes, y dar de baja a un alumno. */
  | 'crew.members'
  /** Publicar y borrar anuncios del muro. */
  | 'crew.wall'
  /** Crear y editar rutinas, planes y el catálogo. */
  | 'training.manage'
  /** Agendar, mover y cancelar sesiones. */
  | 'schedule.manage'
  /** Editar la ficha de un alumno. */
  | 'students.manage'

/**
 * TODO: CUATRO DE ESTAS TODAVÍA NO LAS COMPRUEBA NINGÚN CONTROL.
 *
 * En vigor están `crew.invite`, `crew.members`, `crew.wall` y
 * `schedule.manage`. Las otras cuatro describen el modelo pero no cierran nada:
 *
 *  - `crew.settings` y `crew.staff` no tienen pantalla todavía. Cuando la
 *    tengan, ahí es donde se comprueban.
 *  - `training.manage` y `students.manage` sólo están protegidas por el rango
 *    mínimo de la navegación, no por la capacidad. Un alumno no llega a esas
 *    pantallas, así que nadie puede lo que no debe; lo que NO funciona es lo
 *    contrario: concederle `training.manage` a un alumno no le abre nada,
 *    porque la navegación sigue filtrando por rango.
 *
 * O sea: no hay permiso de más, hay concesión que no surte efecto. Cerrarlo es
 * hacer que la navegación mire también las capacidades concedidas, no sólo el
 * rango.
 */

/** Todas, en el orden en el que se presentan. Gobernar primero. */
export const ALL_CAPABILITIES: Capability[] = [
  'crew.settings',
  'crew.staff',
  'crew.invite',
  'crew.members',
  'crew.wall',
  'training.manage',
  'schedule.manage',
  'students.manage',
]

/** Cómo se llama cada una donde hay que elegirlas. */
export const CAPABILITY_LABEL: Record<Capability, string> = {
  'crew.settings': 'Ajustes del equipo',
  'crew.staff': 'Equipo técnico',
  'crew.invite': 'Invitar y dar de alta',
  'crew.members': 'Aceptar y dar de baja',
  'crew.wall': 'Publicar en el muro',
  'training.manage': 'Rutinas y planes',
  'schedule.manage': 'Agenda',
  'students.manage': 'Fichas de alumnos',
}

/**
 * Lo que trae cada rol de serie.
 *
 * `admin` lo tiene todo: es poder absoluto sobre UN crew, que es exactamente lo
 * que necesita el dueño de un gimnasio. `trainer` lo tiene todo MENOS los dos
 * poderes de gobierno —ajustes y equipo técnico—, que es la diferencia entre
 * dirigir la casa y trabajar en ella. `student` no gestiona nada: su papel es
 * entrenar, y lo que ve de los demás es el muro y el ranking.
 *
 * Quien crea un crew nace `admin`. Por eso en el caso corriente —un entrenador
 * solo— la distinción no se nota: es admin y entrenador a la vez. El rol
 * separado sólo aparece cuando hay más de una persona trabajando.
 */
export const CAPABILITIES_BY_ROLE: Record<CrewRole, Capability[]> = {
  admin: ALL_CAPABILITIES,
  trainer: [
    'crew.invite',
    'crew.members',
    'crew.wall',
    'training.manage',
    'schedule.manage',
    'students.manage',
  ],
  student: [],
}

/** Qué distingue a un rol del anterior, para explicarlo donde se elige. */
export const ROLE_LABEL: Record<CrewRole, string> = {
  admin: 'Administrador',
  trainer: 'Entrenador',
  student: 'Alumno',
}

export const ROLE_DESCRIPTION: Record<CrewRole, string> = {
  admin: 'Manda en el equipo: además de entrenar, cambia los ajustes y decide quién trabaja aquí.',
  trainer: 'Entrena: alumnos, rutinas, agenda y muro. No toca los ajustes ni el equipo técnico.',
  student: 'Entrena aquí. Ve su progreso, el muro y el ranking.',
}

/**
 * Si esta pertenencia autoriza algo.
 *
 * LAS CONCESIONES SÓLO SUMAN, nunca restan. Es la decisión que mantiene esto
 * razonable: se conserva el invariante «nunca puedes menos que tu rol», así que
 * para saber qué puede alguien basta con mirar su rol y, como mucho, un par de
 * extras. Permitir quitar por debajo del rol convertiría cada usuario en un caso
 * único —con ocho capacidades hay 256 combinaciones por persona— y la pregunta
 * «¿qué puede hacer éste?» dejaría de tener respuesta corta.
 */
export function can(
  role: CrewRole,
  capability: Capability,
  extraCapabilities: Capability[] = []
): boolean {
  return (
    CAPABILITIES_BY_ROLE[role].includes(capability) || extraCapabilities.includes(capability)
  )
}

/**
 * Las concesiones que de verdad añaden algo a este rol.
 *
 * Guardar una que el rol ya trae no rompe nada —`can` responde igual— pero
 * ensucia: un admin con «Agenda» concedida aparte sugiere que sin ella no
 * podría, que es falso. Se limpia al guardar, no al leer.
 */
export function meaningfulExtras(role: CrewRole, extraCapabilities: Capability[]): Capability[] {
  const base = CAPABILITIES_BY_ROLE[role]
  return extraCapabilities.filter((capability) => !base.includes(capability))
}
