/**
 * Entrenador, en terminos de la aplicacion.
 *
 * camelCase a proposito: el snake_case de Postgres muere en el mapper del
 * adaptador. Si un backend propio devuelve otra forma, cambia el mapper y esta
 * entidad no se entera.
 */
export interface Trainer {
  id: string
  profileId: string
  firstName: string
  lastName: string
  email?: string
  photoUrl?: string
  bio?: string
  yearsExperience?: number
  verified: boolean
  averageRating?: number
  totalReviews: number
}
