import type { CrewRole } from '@/shared/domain/entities/crew'
import type { Capability } from '@/shared/domain/permissions'
import type { SessionStatus } from '@/shared/domain/entities/session'
import type { BlockMethod } from '@/shared/domain/entities/routine'
import type { StudentLevel } from '@/shared/domain/entities/student'
import type { TranslationKey } from './dictionaries/es'
import type { Translate } from './LanguageContext'

/*
 * Cómo se llama en pantalla el vocabulario del dominio.
 *
 * ESTABA EN `shared/domain/permissions.ts`, en tres constantes con el texto
 * español dentro —`ROLE_LABEL`, `ROLE_DESCRIPTION`, `CAPABILITY_LABEL`—. Ahí
 * sobraba desde el principio y con la traducción dejó de poderse: el dominio no
 * conoce a nadie por encima suyo, y para traducirse tendría que conocer al
 * diccionario.
 *
 * Lo que se queda en el dominio es el VOCABULARIO —qué roles hay, qué
 * capacidades existen, cuál trae cada rol—. Cómo se dice cada uno es
 * presentación, y vive aquí.
 */

export const ROLE_LABEL_KEY: Record<CrewRole, TranslationKey> = {
  admin: 'role.admin',
  trainer: 'role.trainer',
  student: 'role.student',
}

/** Qué distingue a un rol del anterior, para explicarlo donde se elige. */
export const ROLE_DESCRIPTION_KEY: Record<CrewRole, TranslationKey> = {
  admin: 'role.admin.description',
  trainer: 'role.trainer.description',
  student: 'role.student.description',
}

export const CAPABILITY_LABEL_KEY: Record<Capability, TranslationKey> = {
  'crew.settings': 'capability.crew.settings',
  'crew.staff': 'capability.crew.staff',
  'crew.invite': 'capability.crew.invite',
  'crew.members': 'capability.crew.members',
  'crew.wall': 'capability.crew.wall',
  'training.manage': 'capability.training.manage',
  'schedule.manage': 'capability.schedule.manage',
  'students.manage': 'capability.students.manage',
}

/**
 * El estado de una sesion.
 *
 * ESTABA ESCRITO CUATRO VECES -el panel, la agenda, la ficha del alumno y el
 * panel de plataforma-, cada uno con su mapa de rotulos y su mapa de clases.
 * Los colores si difieren de verdad entre pantallas y se quedan donde estaban;
 * las palabras no, y cuatro copias de la misma palabra son cuatro sitios donde
 * olvidarse de traducir una.
 */
export const SESSION_STATUS_LABEL_KEY: Record<SessionStatus, TranslationKey> = {
  pending: 'sessionStatus.pending',
  confirmed: 'sessionStatus.confirmed',
  completed: 'sessionStatus.completed',
  cancelled: 'sessionStatus.cancelled',
}

/** Cada periodo de cuota con su nombre. Las claves son los dias que dura. */
export const SUBSCRIPTION_PERIOD_LABEL_KEY: Record<number, TranslationKey> = {
  30: 'subscriptionPeriod.monthly',
  90: 'subscriptionPeriod.quarterly',
  180: 'subscriptionPeriod.biannual',
  365: 'subscriptionPeriod.annual',
}

/**
 * El nivel, tanto de un alumno como de una rutina o un plan.
 *
 * `StudentLevel` y `TrainingLevel` son la MISMA union de tres palabras
 * declarada dos veces -en `student.ts` y en `routine.ts`-, asi que un solo mapa
 * sirve para las dos. Si algun dia divergen, este es el sitio donde se parte.
 */
export const STUDENT_LEVEL_LABEL_KEY: Record<StudentLevel, TranslationKey> = {
  Principiante: 'studentLevel.beginner',
  Intermedio: 'studentLevel.intermediate',
  Avanzado: 'studentLevel.advanced',
}

/**
 * El rotulo de cada objetivo.
 *
 * LA CLAVE ES EL VALOR QUE SE GUARDA, en castellano: el objetivo se guarda igual
 * lo marque quien lo marque, porque si cambiara con el idioma dos fichas con el
 * mismo objetivo dejarian de agruparse. Aqui solo se traduce como se lee.
 *
 * Es un `Record<string, ...>` y no sobre una union porque hay fichas antiguas
 * con objetivos que no estan en la lista -«Tonificar» viene asi en la semilla-.
 * `goalLabel` los deja pasar tal cual en vez de dejar el hueco vacio.
 */
export const GOAL_LABEL_KEY: Record<string, TranslationKey> = {
  'Perder peso': 'goal.loseWeight',
  'Ganar músculo': 'goal.gainMuscle',
  'Ganar fuerza': 'goal.gainStrength',
  'Mejorar resistencia': 'goal.endurance',
  Movilidad: 'goal.mobility',
  'Rehabilitación': 'goal.rehab',
  'Salud general': 'goal.generalHealth',
}

/** El objetivo, traducido si se conoce y tal cual si no. */
export function goalLabel(goal: string, t: Translate): string {
  const key = GOAL_LABEL_KEY[goal]
  return key === undefined ? goal : t(key)
}

/**
 * El rotulo de las entradas de catalogo que trae el sistema.
 *
 * LA CLAVE ES EL IDENTIFICADOR, no el nombre: el ejercicio guarda `muscleGroupId`
 * y no el texto, asi que traducir aqui no toca ningun dato.
 *
 * `catalogLabel` deja pasar tal cual lo que no encuentra, y eso es lo que hace
 * que funcione con lo que añade el entrenador: el material que él da de alta
 * -«Prensa de piernas»- se guarda con su nombre y se lee con su nombre, como
 * cualquier otra cosa que escriba una persona.
 */
export const CATALOG_LABEL_KEY: Record<string, TranslationKey> = {
  pectoral: 'muscle.pectoral',
  dorsal: 'muscle.dorsal',
  deltoides: 'muscle.deltoides',
  trapecio: 'muscle.trapecio',
  biceps: 'muscle.biceps',
  triceps: 'muscle.triceps',
  cuadriceps: 'muscle.cuadriceps',
  isquiosurales: 'muscle.isquiosurales',
  gluteo: 'muscle.gluteo',
  aductores: 'muscle.aductores',
  gemelos: 'muscle.gemelos',
  abdomen: 'muscle.abdomen',
  lumbar: 'muscle.lumbar',

  'empuje-horizontal': 'pattern.empujeHorizontal',
  'empuje-vertical': 'pattern.empujeVertical',
  'traccion-horizontal': 'pattern.traccionHorizontal',
  'traccion-vertical': 'pattern.traccionVertical',
  'dominante-rodilla': 'pattern.dominanteRodilla',
  'dominante-cadera': 'pattern.dominanteCadera',
  'core-antiextension': 'pattern.coreAntiextension',
  'core-antirotacion': 'pattern.coreAntirotacion',
  monoarticular: 'pattern.monoarticular',

  barra: 'equipment.barra',
  mancuerna: 'equipment.mancuerna',
  kettlebell: 'equipment.kettlebell',
  polea: 'equipment.polea',
  'maquina-guiada': 'equipment.maquinaGuiada',
  multipower: 'equipment.multipower',
  banco: 'equipment.banco',
  banda: 'equipment.banda',
  trx: 'equipment.trx',
  'peso-corporal': 'equipment.pesoCorporal',

  hipertrofia: 'objective.hipertrofia',
  'fuerza-maxima': 'objective.fuerzaMaxima',
  'resistencia-muscular': 'objective.resistenciaMuscular',
  'perdida-grasa': 'objective.perdidaGrasa',
  acondicionamiento: 'objective.acondicionamiento',

  'full-body': 'split.fullBody',
  'torso-pierna': 'split.torsoPierna',
  'empuje-traccion-pierna': 'split.empujeTraccionPierna',
  weider: 'split.weider',
}

/** La descripcion de los objetivos y las divisiones, por identificador. */
export const CATALOG_DESCRIPTION_KEY: Record<string, TranslationKey> = {
  hipertrofia: 'objective.hipertrofia.description',
  'fuerza-maxima': 'objective.fuerzaMaxima.description',
  'resistencia-muscular': 'objective.resistenciaMuscular.description',
  'perdida-grasa': 'objective.perdidaGrasa.description',
  acondicionamiento: 'objective.acondicionamiento.description',
  'full-body': 'split.fullBody.description',
  'torso-pierna': 'split.torsoPierna.description',
  'empuje-traccion-pierna': 'split.empujeTraccionPierna.description',
  weider: 'split.weider.description',
}

/** Region del cuerpo y tipo de material, que son uniones y no identificadores. */
export const CATALOG_ENUM_KEY: Record<string, TranslationKey> = {
  'tren superior': 'region.upper',
  'tren inferior': 'region.lower',
  core: 'region.core',
  'peso libre': 'equipmentKind.freeWeight',
  'máquina': 'equipmentKind.machine',
  accesorio: 'equipmentKind.accessory',
  'peso corporal': 'equipmentKind.bodyweight',
}

/**
 * Una entrada de catalogo, traducida si la trae el sistema y tal cual si no.
 *
 * Recibe el nombre guardado como reserva en vez de un hueco: el material que da
 * de alta un entrenador no esta en ningun diccionario y tiene que leerse igual.
 */
export function catalogLabel(id: string, name: string, t: Translate): string {
  const key = CATALOG_LABEL_KEY[id]
  return key === undefined ? name : t(key)
}

/** Igual que `catalogLabel`, para las descripciones de objetivos y divisiones. */
export function catalogDescription(id: string, description: string, t: Translate): string {
  const key = CATALOG_DESCRIPTION_KEY[id]
  return key === undefined ? description : t(key)
}

/** La region o el tipo, que son uniones cerradas y no tienen identificador. */
export function catalogEnumLabel(value: string, t: Translate): string {
  const key = CATALOG_ENUM_KEY[value]
  return key === undefined ? value : t(key)
}

/**
 * Como se ejecuta un bloque.
 *
 * Sale de `shared/lib/routineFormat.ts`, que es formato y no idioma: alli
 * conviven `formatPrescription` y `formatRest`, que componen cifras y no
 * palabras. Estas cuatro son palabras.
 */
export const BLOCK_METHOD_LABEL_KEY: Record<BlockMethod, TranslationKey> = {
  simple: 'block.method.simple',
  superserie: 'block.method.superserie',
  triserie: 'block.method.triserie',
  circuito: 'block.method.circuito',
}
