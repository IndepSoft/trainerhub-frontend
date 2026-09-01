/**
 * Lo que un entrenador le asigna a un estudiante.
 *
 * ASIGNAR NO ES AGENDAR. Son dos compromisos distintos y la aplicación los
 * mantiene separados a propósito:
 *
 *   - Agendar es «esto, este día a esta hora». Eso ya es una `Session`, que no
 *     existe sin fecha.
 *   - Asignar es «esto es tuyo», sin comprometer ningún hueco. Una rutina
 *     asignada es el repertorio del que dispone el alumno; un plan asignado es
 *     el programa que sigue.
 *
 * Volcar un plan asignado a la agenda —generar sus sesiones— es una tercera
 * acción, opcional, y decisión del entrenador. Que asignar generara sesiones
 * obligaría a fijar horarios para poder asignar, y hay quien asigna un plan para
 * que el alumno lo siga por su cuenta.
 *
 * NO SON EXCLUYENTES. Un alumno puede tener a la vez un plan y tres rutinas
 * sueltas, o dos planes solapados. La aplicación no opina: el entrenador decide.
 *
 * ES UNA UNIÓN DISCRIMINADA, no un registro con dos identificadores opcionales.
 * Así no se puede representar una asignación de rutina con fecha de inicio de
 * plan, ni una que apunte a las dos cosas a la vez: los estados ilegales no
 * llegan a existir en vez de tener que comprobarse.
 */

interface AssignmentBase {
  id: string
  /**
   * El crew al que pertenece. Lo pone el adaptador desde el ámbito activo.
   *
   * Sin esto, la multi-tenencia era ficticia: sólo las fichas de alumno estaban
   * acotadas, así que una cuenta recién registrada y sin equipo veía las
   * sesiones y las rutinas de otro. Medido en el navegador: «5 sesiones esta
   * semana» y tres rutinas, en un usuario que no pertenecía a ningún sitio.
   */
  crewId: string
  studentId: string
  /** Cuándo se asignó. Fecha local `YYYY-MM-DD`. */
  assignedOn: string
  notes: string
}

export interface RoutineAssignment extends AssignmentBase {
  kind: 'routine'
  routineId: string
}

export interface PlanAssignment extends AssignmentBase {
  kind: 'plan'
  planId: string
  /**
   * Desde cuándo cuenta la semana 1 del mesociclo, o `null` si aún no se ha
   * decidido.
   *
   * Es lo que le falta al plan para existir en el tiempo: `PlanDay` dice
   * «lunes», no «lunes 8 de septiembre». Sin esta fecha el plan está asignado
   * pero no anclado, que es un estado legítimo —«éste es tu programa, ya
   * veremos cuándo empiezas»— y por eso admite `null`.
   */
  startDate: string | null
}

export type Assignment = RoutineAssignment | PlanAssignment

export type AssignmentKind = Assignment['kind']

/**
 * Una asignación aún sin identificador, para crearla.
 *
 * Se escribe repartida y NO como `Omit<Assignment, 'id'>`. `Omit` sobre una
 * unión no se reparte: `keyof (A | B)` son las claves COMUNES, así que el
 * resultado habría perdido `routineId`, `planId` y `startDate`, y el puerto
 * habría aceptado asignaciones que no apuntan a nada. Es un fallo silencioso: el
 * compilador no se queja, simplemente deja de exigir lo que importa.
 */
export type NewAssignment =
  | Omit<RoutineAssignment, 'id' | 'crewId'>
  | Omit<PlanAssignment, 'id' | 'crewId'>
