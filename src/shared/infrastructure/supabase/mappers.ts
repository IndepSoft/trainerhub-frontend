import type { Trainer } from '@/shared/domain/entities/trainer'
import type { AuthUser, SignUpProfile } from '@/shared/domain/entities/auth'
import type { TrainerProfile } from '@/shared/domain/ports/TrainerRepository'

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

  return metadata
}

export function toAuthUser(row: AuthUserRow): AuthUser {
  return {
    id: row.id,
    email: row.email ?? '',
  }
}
