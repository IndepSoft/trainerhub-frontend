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
  /**
   * En qué punto está la suscripción de este crew.
   *
   * ES POR CREW Y NO POR ENTRENADOR, aunque quien paga sea una persona: lo que
   * se activa es la capacidad de meter gente EN UN EQUIPO, así que el estado
   * tiene que estar donde está el equipo. Un entrenador con dos crews puede
   * tener uno activo y otro no, que es lo que ocurre cuando abre un segundo
   * local.
   *
   * Sólo la cambia un administrador de plataforma, por `PlatformRepository`. No
   * está en `CrewSettings` a propósito: si estuviera, el dueño del crew podría
   * activarse la suscripción a sí mismo con la pantalla de ajustes.
   */
  subscriptionStatus: SubscriptionStatus
  photoUrl?: string
}

/**
 * El estado de la suscripción de un crew.
 *
 * `pending` es donde nace todo crew: creado y sin activar. `suspended` es
 * distinto —estuvo activo y se apagó—, y se distingue porque lo que hay que
 * decirle al entrenador no es lo mismo: a uno se le explica que falta la
 * activación, al otro que se le ha retirado.
 */
export type SubscriptionStatus = 'pending' | 'active' | 'suspended'

/**
 * Si este crew puede incorporar gente.
 *
 * ES LA PUERTA DEL PRODUCTO. Un entrenador puede crear su equipo, montar su
 * catálogo, escribir rutinas y planificar mesociclos sin pagar nada: todo eso es
 * trabajo suyo y nadie más lo ve. Lo que exige suscripción es METER ALUMNOS —el
 * QR y el alta de fichas—, que es cuando el producto empieza a servirle a más de
 * una persona.
 *
 * Se declara aquí, junto a la entidad, y no dentro de una pantalla, porque la
 * comprueban tres sitios distintos: el QR, el alta de alumnos y la solicitud de
 * entrada. Una regla repetida en tres pantallas es una regla que acabará
 * aplicándose en dos.
 *
 * TODO: hoy la comprueba el cliente. Con backend es una política del servidor:
 * un cliente modificado puede saltarse esto, y por eso la comprobación tiene que
 * existir también donde se escribe.
 */
export function canEnrollMembers(crew: Crew): boolean {
  return crew.subscriptionStatus === 'active'
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
  /**
   * Si se está MIRANDO un equipo ajeno, no perteneciendo a él.
   *
   * Es lo que tiene un administrador de plataforma en los crews que no son
   * suyos: entra a ver, con el papel de entrenador para que las pantallas de
   * gestión se pinten, pero sin poder tocar nada.
   *
   * VER Y PODER SON DOS EJES DISTINTOS, y confundirlos es lo que hace peligroso
   * un rol de administración. Si observar diera `role: 'trainer'` a secas,
   * quien mira podría publicar en el muro de otro —firmado con el nombre del
   * entrenador de verdad—, aceptar solicitudes o borrar alumnos. Eso no es
   * inspeccionar, es suplantar, y es una decisión aparte que nadie ha tomado.
   */
  observed: boolean
}
