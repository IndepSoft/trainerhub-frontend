import type { Student } from './student'

/**
 * El crew: el grupo de entrenamiento, y la unidad de aislamiento de datos.
 *
 * ES EL TENANT. Todo lo que crea un entrenador —alumnos, rutinas, planes,
 * sesiones— pertenece a un crew, y nadie de fuera lo ve. Estaba analizado y sin
 * ejecutar en `CAMBIOS-Y-ARQUITECTURA.md` §5 bajo el nombre `clubs`.
 *
 * EL ENTRENADOR NO ES EL CREW, y es la decisión que más pesa de todo esto. En
 * cuanto un gimnasio tenga un segundo entrenador esa identidad se rompe, y para
 * entonces está grabada en cada clave foránea y cada política de seguridad. Hoy
 * cuesta una tabla; después cuesta una migración.
 */
export interface Crew {
  id: string
  name: string
  /**
   * Cómo lo llama su entrenador: «equipo», «tribu», «box»…
   *
   * Es SÓLO la etiqueta visible. El tipo se llama `Crew` en código y no cambia,
   * porque el nombre de una entidad no puede depender del gusto de un usuario:
   * si lo hiciera, dos instalaciones tendrían modelos distintos.
   */
  denomination: CrewDenomination
  /** El perfil del entrenador que lo creó. Manda sobre los ajustes del crew. */
  ownerId: string
  /**
   * El secreto del QR. Opaco y rotable.
   *
   * NO es el identificador del crew. Un QR que codificara el `id` permitiría
   * enumerar crews probando identificadores, y no habría forma de invalidarlo
   * si alguien lo fotografía: el `id` no se puede cambiar, un token sí.
   */
  joinToken: string
  /**
   * Si las solicitudes de entrada esperan el visto bueno del entrenador.
   *
   * Activado por defecto, porque un QR es un secreto que se enseña en público:
   * quien lo vea en la pared del gimnasio, o en una foto, puede escanearlo. Con
   * aprobación, un QR filtrado no mete a nadie, sólo genera una petición.
   */
  requiresApproval: boolean
  /**
   * Si el ranking se ve en este crew.
   *
   * Se puede apagar a propósito: en un grupo de rehabilitación o de salud
   * general, comparar públicamente el esfuerzo hace daño en vez de motivar.
   */
  rankingEnabled: boolean
  photoUrl?: string
}

/** Las denominaciones que se ofrecen. Lista cerrada, por el mismo motivo que los objetivos de un alumno. */
export const CREW_DENOMINATIONS = [
  'Crew',
  'Equipo',
  'Tribu',
  'Box',
  'Gimnasio',
  'Club',
  'Escuela',
] as const

export type CrewDenomination = (typeof CREW_DENOMINATIONS)[number]

/**
 * Un entrenador de un crew.
 *
 * Tabla aparte y no un campo en `Crew` porque un crew puede tener varios: es
 * justo el caso que rompería modelar entrenador = crew. `ownerId` distingue a
 * quien manda de quien entrena.
 *
 * Los ALUMNOS no están aquí: su pertenencia vive en `Student`, que ya es la
 * ficha que el entrenador lleva de cada uno. Ver la nota de `Student.crewId`.
 */
export interface CrewTrainer {
  id: string
  crewId: string
  profileId: string
}

/**
 * Con qué papel se está en un crew.
 *
 * ES POR CREW, NO POR PERSONA. Alguien puede entrenar a su equipo y a la vez ser
 * alumno del club de running de al lado, y las dos cosas son ciertas a la vez.
 * Un rol global obligaria a elegir, o a inventar un tercero que no significa
 * nada. Lo dice tambien `CAMBIOS-Y-ARQUITECTURA.md` §5: «el rol es por club».
 */
export type CrewRole = 'trainer' | 'student'

/**
 * En qué punto está la pertenencia de un alumno a un crew.
 *
 * LA LÍNEA IMPORTANTE ESTÁ ENTRE `pending` Y EL RESTO, y no donde parece.
 * `invited` y `active` son los dos formas de PERTENECER: en las dos, la persona
 * entrena ahí y el entrenador le agenda sesiones. Lo único que las separa es si
 * ya tiene cuenta con la que entrar, que importa para lo que ve ella, no para
 * quién es del equipo.
 *
 * `pending` es distinto de verdad: alguien escaneó el QR y todavía NO es del
 * equipo. Es lo único que exige una decisión.
 *
 * La primera versión los agrupaba al revés —contaba miembros sólo los `active`—
 * y la pantalla decía «0 miembros» sobre un equipo con cuatro alumnos con ficha.
 */
export type MembershipStatus = 'invited' | 'pending' | 'active' | 'rejected'

/** Si esta pertenencia cuenta como ser del equipo. */
export function isMember(status: MembershipStatus): boolean {
  return status === 'active' || status === 'invited'
}

/**
 * Una pertenencia resuelta: un crew, y con qué papel se está en él.
 *
 * Vive en el dominio y no en el hook que la construye porque la usan la barra
 * lateral y la barra superior, que son de `shared`. Un tipo de `shared` que se
 * importa de `app/` invierte la direccion de dependencias: la capa compartida no
 * debe conocer a la aplicacion que la usa.
 */
export interface Membership {
  crew: Crew
  role: CrewRole
  status: MembershipStatus
  /** La ficha, cuando se está como alumno. `null` cuando se entrena. */
  student: Student | null
}
