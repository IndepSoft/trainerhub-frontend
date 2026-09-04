import type { Trainer } from '@/shared/domain/entities/trainer'
import type { NewTrainer } from '@/shared/domain/ports/TrainerRepository'
import type { AuthUser } from '@/shared/domain/entities/auth'
import type { TrainerProfile } from '@/shared/domain/ports/TrainerRepository'

/** Fila cruda de la tabla `trainers`. Nombres tal cual estan en Postgres. */
export interface TrainerRow {
  id: number | string
  profile_id: string
  first_name: string
  last_name: string
  email?: string | null
  photo_url?: string | null
  bio?: string | null
  years_experience?: number | null
  verified?: boolean | null
  average_rating?: number | null
  total_reviews?: number | null
}

/** Fila cruda del usuario de Supabase Auth. */
export interface AuthUserRow {
  id: string
  email?: string | null
}

const optional = <T,>(value: T | null | undefined): T | undefined =>
  value === null || value === undefined ? undefined : value

/**
 * Traduce una fila de `trainers` a la entidad de dominio.
 *
 * Aqui muere el snake_case, y aqui se normalizan los nulos de SQL a undefined.
 * `id` pasa a string a proposito: que la clave sea un entero es un detalle del
 * esquema actual, no algo que la aplicacion deba asumir.
 */
export function toTrainer(row: TrainerRow): Trainer {
  return {
    id: String(row.id),
    profileId: row.profile_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: optional(row.email),
    photoUrl: optional(row.photo_url),
    bio: optional(row.bio),
    yearsExperience: optional(row.years_experience),
    verified: row.verified ?? false,
    averageRating: optional(row.average_rating),
    totalReviews: row.total_reviews ?? 0,
  }
}

/**
 * Traduce un alta de entrenador a la fila que espera Postgres.
 *
 * El mapper de ida hacia falta en cuanto hubo escrituras: hasta ahora todo era
 * lectura y el snake_case solo tenia que morir en una direccion. Sin el, quien
 * inserta tendria que conocer los nombres de las columnas, que es exactamente
 * la fuga que los mappers existen para evitar.
 *
 * `id` no se manda: lo genera la base. Tampoco `verified` ni `total_reviews`,
 * que tienen valor por defecto en el esquema.
 */
export function toTrainerRow(trainer: NewTrainer): Omit<TrainerRow, 'id'> {
  return {
    profile_id: trainer.profileId,
    first_name: trainer.firstName,
    last_name: trainer.lastName,
    email: trainer.email,
    bio: trainer.bio ?? null,
    years_experience: trainer.yearsExperience ?? null,
  }
}

/**
 * La parte de la fila que cambia un perfil.
 *
 * Ni `profile_id` ni `email`: el primero es la cuenta con la que se entra y el
 * segundo la llave por la que se reconoce a alguien. Que no estén aquí no es una
 * omisión, es la garantía de que un `update` de perfil no puede tocarlos.
 */
export function toTrainerProfileRow(
  profile: TrainerProfile
): Pick<TrainerRow, 'first_name' | 'last_name' | 'photo_url' | 'bio' | 'years_experience'> {
  return {
    first_name: profile.firstName,
    last_name: profile.lastName,
    photo_url: profile.photoUrl ?? null,
    bio: profile.bio ?? null,
    years_experience: profile.yearsExperience ?? null,
  }
}

export function toAuthUser(row: AuthUserRow): AuthUser {
  return {
    id: row.id,
    email: row.email ?? '',
  }
}
