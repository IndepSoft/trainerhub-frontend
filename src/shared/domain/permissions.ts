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
 * LAS OCHO SE COMPRUEBAN. Dónde, para no tener que buscarlo:
 *
 *   crew.settings     `/crew/ajustes`
 *   crew.staff        `/crew/equipo`
 *   crew.invite       el QR del equipo, y el alta en el padrón de alumnos
 *   crew.members      aceptar y rechazar solicitudes
 *   crew.wall         publicar y borrar anuncios
 *   training.manage   el destino «Entrenamientos» de la navegación
 *   schedule.manage   «Nueva sesión» en la agenda
 *   students.manage   el destino «Estudiantes» de la navegación
 *
 * Los dos destinos de navegación se filtran POR CAPACIDAD y no por rango, que es
 * lo que hace que conceder una llave suelta sirva de algo: antes se guardaba la
 * concesión y la puerta seguía cerrada.
 *
 * TODO: todo esto lo comprueba el navegador. Impide equivocarse, no impide
 * actuar. La tabla de qué política de servidor sustituye a cada regla está en
 * `docs/CAMBIOS-Y-ARQUITECTURA.md` §14.5.
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

/*
 * CÓMO SE LLAMA CADA UNA NO ESTÁ AQUÍ. Las etiquetas de roles y capacidades
 * viven en `shared/i18n/domainLabels.ts`: el dominio define QUÉ existe, y cómo
 * se dice en cada idioma es presentación. Mientras el texto estuvo aquí dentro,
 * traducirlo habría obligado al dominio a conocer al diccionario.
 */

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

/**
 * Por qué NO se puede cambiar este puesto, o `undefined` si se puede.
 *
 * UN CREW NO SE PUEDE QUEDAR SIN ADMINISTRADOR. Sin esta regla, bajar de rango
 * al último —o borrarlo— dejaba un equipo que nadie puede gobernar: sus ajustes
 * quedan congelados y no hay quien meta a otro administrador, porque justamente
 * eso exige ser administrador. Es una puerta que se cierra por dentro.
 *
 * Se comprueba sobre la LISTA COMPLETA de puestos del crew y no sobre un
 * contador: un contador guardado se desincroniza en cuanto alguien entra o sale,
 * y aquí equivocarse significa perder el equipo.
 *
 * Devuelve el motivo y no un booleano porque quien llama tiene que poder
 * explicarlo. Un botón desactivado sin explicación es un botón roto.
 */
export function lastAdminBlocker(
  staff: Array<{ id: string; role: CrewRole }>,
  staffId: string,
  nextRole: CrewRole | null
): string | undefined {
  const target = staff.find((entry) => entry.id === staffId)
  if (target === undefined || target.role !== 'admin') return undefined

  // `null` es «se le quita el puesto». Cualquier otro rol que no sea admin
  // también le retira el gobierno, así que los dos casos son el mismo.
  const keepsBeingAdmin = nextRole === 'admin'
  if (keepsBeingAdmin) return undefined

  const admins = staff.filter((entry) => entry.role === 'admin')
  if (admins.length > 1) return undefined

  return 'Es el único administrador del equipo. Nombra a otro antes de cambiarle el papel.'
}
