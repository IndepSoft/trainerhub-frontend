import type { Trainer } from '@/shared/domain/entities/trainer'
import type { AuthUser, SignUpProfile } from '@/shared/domain/entities/auth'
import type { TrainerProfile } from '@/shared/domain/ports/TrainerRepository'
import type { CrewSettings } from '@/shared/domain/ports/CrewRepository'
import {
  CREW_DENOMINATIONS,
  type Crew,
  type CrewDenomination,
  type CrewRole,
  type CrewStaff,
  type SubscriptionStatus,
} from '@/shared/domain/entities/crew'
import { ALL_CAPABILITIES, type Capability } from '@/shared/domain/permissions'
import type { MembershipStatus } from '@/shared/domain/entities/crew'
import type { Student, StudentLevel } from '@/shared/domain/entities/student'
import type { NewStudent, StudentProfile } from '@/shared/domain/ports/StudentRepository'
import type { StudentSubscription } from '@/shared/domain/entities/studentSubscription'
import type { Notice } from '@/shared/domain/entities/notice'
import type { CrewOverview, PlatformUser } from '@/shared/domain/ports/PlatformRepository'
import type { Block, Routine, TrainingLevel } from '@/shared/domain/entities/routine'
import type { NewRoutine } from '@/shared/domain/ports/RoutineRepository'
import type { PlanWeek, TrainingPlan } from '@/shared/domain/entities/plan'
import type { NewPlan } from '@/shared/domain/ports/PlanRepository'
import type { Assignment, NewAssignment } from '@/shared/domain/entities/assignment'
import type { Exercise } from '@/shared/domain/entities/exercise'
import type {
  Equipment,
  MovementPattern,
  MuscleGroup,
  TrainingObjective,
  TrainingSplit,
} from '@/shared/domain/entities/catalog'
import type { SavedBlock } from '@/shared/domain/entities/savedBlock'
import type { Session, SessionResult, SessionStatus } from '@/shared/domain/entities/session'
import type { NewSession } from '@/shared/domain/ports/SessionRepository'
import type { CrewPost } from '@/shared/domain/entities/crewPost'
import type { CrewMemberProgress } from '@/shared/domain/ports/CrewProgressRepository'

/**
 * Fila cruda de la tabla `profiles`. Nombres tal cual estan en Postgres.
 *
 * ERA `TrainerRow`, DE UNA TABLA `trainers` QUE NO EXISTE. El codigo pedia
 * `/rest/v1/trainers` y recibia un 404 en cada carga; lo que hay en esta base
 * es `profiles`, uno a uno con `auth.users` y creada por el disparador
 * `on_auth_user_created` en el mismo acto que la cuenta.
 *
 * `role` discrimina a quien entrena de quien solo entrena consigo mismo. NO es
 * el rol con el que se gobierna un equipo -ese sale del puesto que se tenga en
 * el- y por eso no viaja a la entidad: aqui solo decide si hay ficha que
 * devolver.
 */
export interface ProfileRow {
  id: string
  email?: string | null
  first_name: string
  last_name: string
  role: string
  specialty?: string | null
  /** Texto y no numero: el formulario ofrece rangos -«1-3 años»-, no cifras. */
  years_of_experience?: string | null
  location?: string | null
  photo_url?: string | null
  bio?: string | null
}

/** Fila cruda del usuario de Supabase Auth. */
export interface AuthUserRow {
  id: string
  email?: string | null
}

const optional = <T,>(value: T | null | undefined): T | undefined =>
  value === null || value === undefined ? undefined : value

/**
 * Los años de experiencia, de rango a numero.
 *
 * Se guardan como texto porque el formulario ofrece rangos, y la entidad los
 * quiere como numero: «1-3 años» se lee como 1, que es el suelo del rango. Se
 * pierde el techo, y es una perdida que ya existia antes de tocar nada; queda
 * anotada aqui porque este es el sitio donde se ve.
 */
function toYearsExperience(value: string | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

/**
 * Traduce una fila de `profiles` a la entidad de dominio.
 *
 * Aqui muere el snake_case, y aqui se normalizan los nulos de SQL a undefined.
 *
 * `id` Y `profileId` SON LO MISMO, y no es un descuido: la clave de `profiles`
 * ES el identificador de la cuenta en `auth.users`. La entidad conserva los dos
 * campos porque el dominio distingue «la ficha» de «la cuenta» y puede volver a
 * distinguirlas -una persona con dos fichas, un esquema con tabla propia-; que
 * hoy coincidan es un detalle de este esquema y muere aqui.
 *
 * `verified`, `averageRating` y `totalReviews` no tienen columna, asi que se
 * responden con lo que es cierto: nadie esta verificado y no hay reseñas,
 * porque no existe todavia un sistema de reseñas que las produzca.
 */
export function toTrainer(row: ProfileRow): Trainer {
  return {
    id: row.id,
    profileId: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: optional(row.email),
    photoUrl: optional(row.photo_url),
    bio: optional(row.bio),
    yearsExperience: toYearsExperience(row.years_of_experience),
    verified: false,
    totalReviews: 0,
  }
}

/**
 * La parte de la fila que cambia un perfil.
 *
 * Ni `id` ni `email` ni `role`: los dos primeros son la cuenta y la llave por la
 * que se reconoce a alguien, y el tercero ni siquiera se puede escribir desde el
 * navegador -el permiso de `authenticated` va por columna y `role` no esta en la
 * lista-. Que no esten aqui no es una omision: es la garantia de que guardar el
 * perfil no puede tocarlos.
 */
export function toProfileUpdate(
  profile: TrainerProfile
): Pick<ProfileRow, 'first_name' | 'last_name' | 'photo_url' | 'bio' | 'years_of_experience'> {
  return {
    first_name: profile.firstName,
    last_name: profile.lastName,
    photo_url: profile.photoUrl ?? null,
    bio: profile.bio ?? null,
    years_of_experience:
      profile.yearsExperience === undefined ? null : String(profile.yearsExperience),
  }
}

/**
 * El perfil, tal y como lo espera el disparador que crea la fila.
 *
 * VIAJA EN LOS METADATOS DEL ALTA porque es el unico momento en que se puede
 * decir: con la confirmacion por correo activada no hay sesion despues del
 * registro, y sin sesion las politicas de fila rechazan la escritura. Ver
 * `SignUpCredentials`.
 *
 * Las claves van en snake_case porque las lee `handle_new_user` desde
 * `raw_user_meta_data`. Esa traduccion vive aqui, con las demas, y no en el
 * adaptador: es exactamente la fuga que los mappers existen para evitar.
 */
export function toSignUpMetadata(profile: SignUpProfile): Record<string, string> {
  const metadata: Record<string, string> = {
    intent: profile.intent,
    first_name: profile.firstName,
    last_name: profile.lastName,
  }

  // Lo que no se dijo no se manda: una cadena vacia en `specialty` se guardaria
  // como especialidad en blanco, que no es lo mismo que no tenerla.
  if (profile.specialty !== undefined) metadata.specialty = profile.specialty
  if (profile.yearsOfExperience !== undefined) {
    metadata.years_of_experience = profile.yearsOfExperience
  }
  if (profile.location !== undefined) metadata.location = profile.location
  if (profile.joinCode !== undefined) metadata.join_code = profile.joinCode

  return metadata
}

/** Fila cruda de `crews`. */
export interface CrewRow {
  id: string
  name: string
  denomination: string
  created_by?: string | null
  join_token?: string | null
  requires_approval: boolean
  ranking_enabled?: boolean | null
  subscription_status: string
  photo_url?: string | null
}

function isCrewDenomination(value: string): value is CrewDenomination {
  return (CREW_DENOMINATIONS as readonly string[]).includes(value)
}

function isSubscriptionStatus(value: string): value is SubscriptionStatus {
  return value === 'pending' || value === 'active' || value === 'suspended'
}

/**
 * Traduce una fila de `crews` a la entidad.
 *
 * ADMITE FILAS INCOMPLETAS a proposito: `find_crew_by_join_token` devuelve solo
 * lo que la pantalla de unirse enseña -quien escanea el QR todavia no es
 * miembro y no debe ver mas-. Lo que no viene se queda en su valor neutro:
 * `ownerId` vacio, `joinToken` vacio, ranking desactivado. Ningun consumidor
 * de esa busqueda los lee; los de `findById` reciben la fila entera.
 *
 * `denomination` y `subscription_status` se estrechan desde texto y no se
 * confia en ellos: la base los restringe con un `check`, pero la frontera
 * vuelve a comprobarlo porque es la unica que puede prometerlo al dominio.
 */
export function toCrew(row: CrewRow): Crew {
  return {
    id: row.id,
    name: row.name,
    denomination: isCrewDenomination(row.denomination) ? row.denomination : 'Crew',
    ownerId: row.created_by ?? '',
    joinToken: row.join_token ?? '',
    requiresApproval: row.requires_approval,
    rankingEnabled: row.ranking_enabled ?? false,
    subscriptionStatus: isSubscriptionStatus(row.subscription_status)
      ? row.subscription_status
      : 'pending',
    photoUrl: optional(row.photo_url),
  }
}

/** Lo que cambia desde los ajustes del equipo. Ni el token, ni la suscripcion. */
export function toCrewSettingsRow(
  settings: CrewSettings
): Pick<CrewRow, 'name' | 'denomination' | 'requires_approval' | 'ranking_enabled'> {
  return {
    name: settings.name,
    denomination: settings.denomination,
    requires_approval: settings.requiresApproval,
    ranking_enabled: settings.rankingEnabled,
  }
}

/**
 * Fila cruda de `crew_staff`, con el perfil incrustado por PostgREST.
 *
 * `profiles` viene a `null` cuando la politica de `profiles` no deja leerlo,
 * que no deberia pasar entre companeros de equipo -hay una politica para eso-,
 * pero la frontera lo contempla en vez de reventar.
 */
export interface CrewStaffRow {
  id: string
  crew_id: string
  profile_id: string
  role: string
  extra_capabilities: string[] | null
  profiles: { first_name: string; last_name: string; email: string } | null
}

function isCrewRole(value: string): value is CrewRole {
  return value === 'admin' || value === 'trainer' || value === 'student'
}

function isCapability(value: string): value is Capability {
  return (ALL_CAPABILITIES as readonly string[]).includes(value)
}

/**
 * Traduce un puesto. El nombre y el correo SE LEEN del perfil, no se copian:
 * era la excepcion a «se referencia el vocabulario» mientras no habia entidad
 * de persona. Ahora la hay.
 */
export function toCrewStaff(row: CrewStaffRow): CrewStaff {
  const person = row.profiles
  return {
    id: row.id,
    crewId: row.crew_id,
    profileId: row.profile_id,
    role: isCrewRole(row.role) ? row.role : 'student',
    extraCapabilities: (row.extra_capabilities ?? []).filter(isCapability),
    displayName: person === null ? '' : `${person.first_name} ${person.last_name}`.trim(),
    email: person?.email ?? '',
  }
}

/** Fila cruda de `students`. */
export interface StudentRow {
  id: string
  crew_id: string
  profile_id: string | null
  first_name: string
  last_name: string
  email: string
  level: string
  goals: string[] | null
  age: number
  body_fat_percentage: number | string
  photo_url?: string | null
  extra_capabilities: string[] | null
  membership_status: string
}

function isStudentLevel(value: string): value is StudentLevel {
  return value === 'Principiante' || value === 'Intermedio' || value === 'Avanzado'
}

function isMembershipStatus(value: string): value is MembershipStatus {
  return value === 'invited' || value === 'pending' || value === 'active' || value === 'rejected'
}

/**
 * Traduce una ficha. `body_fat_percentage` es `numeric` en Postgres y PostgREST
 * lo manda como texto o como numero segun la configuracion: se normaliza aqui,
 * que es donde mueren esas decisiones.
 */
export function toStudent(row: StudentRow): Student {
  return {
    id: row.id,
    crewId: row.crew_id,
    profileId: row.profile_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    level: isStudentLevel(row.level) ? row.level : 'Principiante',
    goals: row.goals ?? [],
    age: row.age,
    bodyFatPercentage: Number(row.body_fat_percentage),
    photoUrl: optional(row.photo_url),
    extraCapabilities: (row.extra_capabilities ?? []).filter(isCapability),
    membershipStatus: isMembershipStatus(row.membership_status) ? row.membership_status : 'invited',
  }
}

/** Una ficha nueva o editada entera, tal y como la escribe el entrenador. */
export function toStudentRow(student: NewStudent): Omit<StudentRow, 'id' | 'crew_id'> {
  return {
    profile_id: student.profileId,
    first_name: student.firstName,
    last_name: student.lastName,
    email: student.email,
    level: student.level,
    goals: student.goals,
    age: student.age,
    body_fat_percentage: student.bodyFatPercentage,
    photo_url: student.photoUrl ?? null,
    extra_capabilities: student.extraCapabilities,
    membership_status: student.membershipStatus,
  }
}

/** Lo que un alumno cambia de si mismo. Nada mas: lo demas es la libreta del entrenador. */
export function toStudentProfileRow(
  profile: StudentProfile
): Pick<StudentRow, 'first_name' | 'last_name' | 'photo_url'> {
  return {
    first_name: profile.firstName,
    last_name: profile.lastName,
    photo_url: profile.photoUrl ?? null,
  }
}

/** Fila cruda de `student_subscriptions`. */
export interface SubscriptionRow {
  student_id: string
  crew_id: string
  period_days: number
  paid_through: string | null
}

export function toSubscription(row: SubscriptionRow): StudentSubscription {
  return {
    studentId: row.student_id,
    crewId: row.crew_id,
    periodDays: row.period_days,
    paidThrough: row.paid_through,
  }
}

export function toSubscriptionRow(subscription: StudentSubscription): SubscriptionRow {
  return {
    student_id: subscription.studentId,
    crew_id: subscription.crewId,
    period_days: subscription.periodDays,
    paid_through: subscription.paidThrough,
  }
}

/** Fila cruda de `notices`. */
export interface NoticeRow {
  id: string
  crew_id: string
  student_id: string
  kind: string
  body: string
  created_at: string
  read_at: string | null
}

export function toNotice(row: NoticeRow): Notice {
  return {
    id: row.id,
    crewId: row.crew_id,
    studentId: row.student_id,
    kind: row.kind === 'dues' ? 'dues' : 'general',
    body: row.body,
    createdAt: row.created_at,
    readAt: row.read_at,
  }
}

/** Lo que devuelve `platform_list_crews`. */
export interface PlatformCrewRow {
  crew: CrewRow
  member_count: number | string
  owner_name: string | null
}

export function toCrewOverview(row: PlatformCrewRow): CrewOverview {
  return {
    crew: toCrew(row.crew),
    memberCount: Number(row.member_count),
    ownerName: row.owner_name,
  }
}

/** Lo que devuelve `platform_list_users`: una persona en un equipo, y el total de la consulta. */
export interface PlatformUserRow {
  membership_id: string
  profile_id: string | null
  display_name: string
  email: string
  crew_id: string
  crew_name: string
  role: string
  extra_capabilities: string[] | null
  total: number | string
}

export function toPlatformUser(row: PlatformUserRow): PlatformUser {
  return {
    membershipId: row.membership_id,
    profileId: row.profile_id,
    displayName: row.display_name,
    email: row.email,
    crewId: row.crew_id,
    crewName: row.crew_name,
    role: isCrewRole(row.role) ? row.role : 'student',
    extraCapabilities: (row.extra_capabilities ?? []).filter(isCapability),
  }
}

/*
 * ------------------------------------------------------------------------
 * Fase 3: entrenamiento.
 *
 * LOS DOCUMENTOS JSONB SE PASAN TAL CUAL. `blocks`, `weeks` y `block` tienen
 * en Postgres exactamente la forma de `Routine.blocks`, `TrainingPlan.weeks` y
 * `Block`; la base los valida por forma al escribir (`is_valid_blocks`,
 * `is_valid_weeks`, `is_valid_block`), asi que lo que vuelve ya es la entidad.
 * Un mapper que recorriera bloque a bloque duplicaria esa validacion en dos
 * sitios, y es justo lo que se decidio no hacer (plan, §1.2). Aqui muere el
 * snake_case de las columnas, y nada mas.
 * ------------------------------------------------------------------------
 */

function isTrainingLevel(value: string): value is TrainingLevel {
  return value === 'Principiante' || value === 'Intermedio' || value === 'Avanzado'
}

/** Fila cruda de `routines`. */
export interface RoutineRow {
  id: string
  crew_id: string
  title: string
  description: string
  level: string
  blocks: Block[]
}

export function toRoutine(row: RoutineRow): Routine {
  return {
    id: row.id,
    crewId: row.crew_id,
    title: row.title,
    description: row.description,
    level: isTrainingLevel(row.level) ? row.level : 'Principiante',
    blocks: row.blocks,
  }
}

export function toRoutineRow(routine: NewRoutine): Omit<RoutineRow, 'id' | 'crew_id'> {
  return {
    title: routine.title,
    description: routine.description,
    level: routine.level,
    blocks: routine.blocks,
  }
}

/** Fila cruda de `plans`. */
export interface PlanRow {
  id: string
  crew_id: string
  title: string
  description: string
  objective_id: string
  split_id: string
  weekly_frequency: number
  level: string
  weeks: PlanWeek[]
}

export function toPlan(row: PlanRow): TrainingPlan {
  return {
    id: row.id,
    crewId: row.crew_id,
    title: row.title,
    description: row.description,
    objectiveId: row.objective_id,
    splitId: row.split_id,
    weeklyFrequency: row.weekly_frequency,
    level: isTrainingLevel(row.level) ? row.level : 'Principiante',
    weeks: row.weeks,
  }
}

export function toPlanRow(plan: NewPlan): Omit<PlanRow, 'id' | 'crew_id'> {
  return {
    title: plan.title,
    description: plan.description,
    objective_id: plan.objectiveId,
    split_id: plan.splitId,
    weekly_frequency: plan.weeklyFrequency,
    level: plan.level,
    weeks: plan.weeks,
  }
}

/** Fila cruda de `assignments`. Una de las dos referencias viene nula. */
export interface AssignmentRow {
  id: string
  crew_id: string
  student_id: string
  kind: string
  routine_id: string | null
  plan_id: string | null
  start_date: string | null
  assigned_on: string
  notes: string
}

/**
 * La union discriminada se reconstruye por `kind`. La base garantiza con un
 * `check` que la referencia que toca no es nula; el `?? ''` es la frontera
 * diciendolo por segunda vez, porque la entidad no admite nulos ahi.
 */
export function toAssignment(row: AssignmentRow): Assignment {
  const base = {
    id: row.id,
    crewId: row.crew_id,
    studentId: row.student_id,
    assignedOn: row.assigned_on,
    notes: row.notes,
  }
  if (row.kind === 'plan') {
    return { ...base, kind: 'plan', planId: row.plan_id ?? '', startDate: row.start_date }
  }
  return { ...base, kind: 'routine', routineId: row.routine_id ?? '' }
}

export function toAssignmentRow(assignment: NewAssignment): Omit<AssignmentRow, 'id' | 'crew_id'> {
  return {
    student_id: assignment.studentId,
    kind: assignment.kind,
    routine_id: assignment.kind === 'routine' ? assignment.routineId : null,
    plan_id: assignment.kind === 'plan' ? assignment.planId : null,
    start_date: assignment.kind === 'plan' ? assignment.startDate : null,
    assigned_on: assignment.assignedOn,
    notes: assignment.notes,
  }
}

/** Fila cruda de `exercises`. */
export interface ExerciseRow {
  id: string
  crew_id: string | null
  name: string
  description: string | null
  equipment_id: string
  movement_pattern_id: string
  primary_muscle_group_id: string
  secondary_muscle_group_ids: string[] | null
  instructions: string[] | null
}

export function toExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    description: optional(row.description),
    equipmentId: row.equipment_id,
    movementPatternId: row.movement_pattern_id,
    primaryMuscleGroupId: row.primary_muscle_group_id,
    secondaryMuscleGroupIds: row.secondary_muscle_group_ids ?? [],
    instructions: row.instructions ?? [],
  }
}

export function toExerciseRow(exercise: Omit<Exercise, 'id'>): Omit<ExerciseRow, 'id' | 'crew_id'> {
  return {
    name: exercise.name,
    description: exercise.description ?? null,
    equipment_id: exercise.equipmentId,
    movement_pattern_id: exercise.movementPatternId,
    primary_muscle_group_id: exercise.primaryMuscleGroupId,
    secondary_muscle_group_ids: exercise.secondaryMuscleGroupIds,
    instructions: exercise.instructions,
  }
}

/** Filas crudas del catalogo. */
export interface MuscleGroupRow {
  id: string
  name: string
  region: string
}
export interface MovementPatternRow {
  id: string
  name: string
}
export interface EquipmentRow {
  id: string
  crew_id: string | null
  name: string
  kind: string
}
export interface TrainingObjectiveRow {
  id: string
  name: string
  description: string
}
export interface TrainingSplitRow {
  id: string
  name: string
  description: string
  sessions_per_week: number
}

function isRegion(value: string): value is MuscleGroup['region'] {
  return value === 'tren superior' || value === 'tren inferior' || value === 'core'
}

function isEquipmentKind(value: string): value is Equipment['kind'] {
  return (
    value === 'peso libre' || value === 'máquina' || value === 'accesorio' || value === 'peso corporal'
  )
}

export function toMuscleGroup(row: MuscleGroupRow): MuscleGroup {
  return { id: row.id, name: row.name, region: isRegion(row.region) ? row.region : 'core' }
}

export function toMovementPattern(row: MovementPatternRow): MovementPattern {
  return { id: row.id, name: row.name }
}

export function toEquipment(row: EquipmentRow): Equipment {
  return { id: row.id, name: row.name, kind: isEquipmentKind(row.kind) ? row.kind : 'accesorio' }
}

export function toEquipmentRow(equipment: Omit<Equipment, 'id'>): Pick<EquipmentRow, 'name' | 'kind'> {
  return { name: equipment.name, kind: equipment.kind }
}

export function toTrainingObjective(row: TrainingObjectiveRow): TrainingObjective {
  return { id: row.id, name: row.name, description: row.description }
}

export function toTrainingSplit(row: TrainingSplitRow): TrainingSplit {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    sessionsPerWeek: row.sessions_per_week,
  }
}

/** Fila cruda de `saved_blocks`. */
export interface SavedBlockRow {
  id: string
  crew_id: string
  name: string
  block: Block
}

export function toSavedBlock(row: SavedBlockRow): SavedBlock {
  return { id: row.id, name: row.name, block: row.block }
}

/*
 * ------------------------------------------------------------------------
 * Fase 4: la agenda.
 * ------------------------------------------------------------------------
 */

/** Fila cruda de `sessions`. `time` llega como «09:00:00»; la entidad usa «09:00». */
export interface SessionRow {
  id: string
  crew_id: string
  student_id: string | null
  title: string
  kind: string
  modality: string
  category: string
  date: string
  time: string
  duration_minutes: number
  location: string
  status: string
  notes: string
  routine_id: string | null
  result: SessionResult | null
  assignment_id: string | null
}

function isSessionStatus(value: string): value is SessionStatus {
  return value === 'pending' || value === 'confirmed' || value === 'completed' || value === 'cancelled'
}

export function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    crewId: row.crew_id,
    title: row.title,
    studentId: row.student_id,
    kind: row.kind === 'group' ? 'group' : 'individual',
    modality: row.modality === 'cardio' ? 'cardio' : 'strength',
    category: row.category,
    date: row.date,
    // Postgres devuelve la hora con segundos; la agenda trabaja en «HH:MM».
    time: row.time.slice(0, 5),
    durationMinutes: row.duration_minutes,
    location: row.location,
    status: isSessionStatus(row.status) ? row.status : 'pending',
    notes: row.notes,
    routineId: row.routine_id,
    result: row.result,
  }
}

export function toSessionRow(session: NewSession): Omit<SessionRow, 'id' | 'crew_id' | 'assignment_id'> {
  return {
    student_id: session.studentId,
    title: session.title,
    kind: session.kind,
    modality: session.modality,
    category: session.category,
    date: session.date,
    time: session.time,
    duration_minutes: session.durationMinutes,
    location: session.location,
    status: session.status,
    notes: session.notes,
    routine_id: session.routineId,
    result: session.result,
  }
}

/*
 * ------------------------------------------------------------------------
 * Fase 5: muro y ranking.
 * ------------------------------------------------------------------------
 */

/** Fila de `crew_posts_view`: la tabla mas los dos campos calculados. */
export interface CrewPostRow {
  id: string
  crew_id: string
  author_profile_id: string
  body: string
  created_at: string
  like_count: number | string
  liked_by_me: boolean
}

export function toCrewPost(row: CrewPostRow): CrewPost {
  return {
    id: row.id,
    crewId: row.crew_id,
    authorProfileId: row.author_profile_id,
    body: row.body,
    createdAt: row.created_at,
    likeCount: Number(row.like_count),
    likedByMe: row.liked_by_me,
  }
}

/** Una fila de `crew_ranking`: agregados por alumno, y nada mas. */
export interface CrewProgressRow {
  student_id: string
  first_name: string
  last_name: string
  photo_url: string | null
  experience: number | string
  completed_sessions: number | string
}

export function toCrewMemberProgress(row: CrewProgressRow): CrewMemberProgress {
  return {
    studentId: row.student_id,
    firstName: row.first_name,
    lastName: row.last_name,
    photoUrl: optional(row.photo_url),
    experience: Number(row.experience),
    completedSessions: Number(row.completed_sessions),
  }
}

export function toAuthUser(row: AuthUserRow): AuthUser {
  return {
    id: row.id,
    email: row.email ?? '',
  }
}
