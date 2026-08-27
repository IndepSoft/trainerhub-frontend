import type { Trainer } from '@/shared/domain/entities/trainer'
import type { AuthUser } from '@/shared/domain/entities/auth'

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

export function toAuthUser(row: AuthUserRow): AuthUser {
  return {
    id: row.id,
    email: row.email ?? '',
  }
}
