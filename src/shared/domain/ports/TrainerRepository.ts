import type { Trainer } from '../entities/trainer'

/**
 * Puerto de acceso a entrenadores.
 *
 * Metodos con intencion de negocio (findByProfileId), nunca constructores de
 * consulta (select/eq/filters). Esa es la diferencia entre poder cambiar de
 * backend y no poder: si el puerto expone el lenguaje de consulta de PostgREST,
 * el desacoplamiento es ficticio.
 */
export interface TrainerRepository {
  findByProfileId(profileId: string): Promise<Trainer | null>

  /**
   * Crea la ficha del entrenador para una cuenta recien registrada.
   *
   * `profileId` viene en los datos y no como argumento aparte porque es lo que
   * ata la ficha a la cuenta: sin el, el entrenador existe pero nunca vuelve a
   * encontrarse al entrar.
   */
  create(data: NewTrainer): Promise<Trainer>
}

/**
 * Datos con los que nace un entrenador.
 *
 * `verified` y `totalReviews` no estan: los pone el sistema -nadie se registra
 * verificado ni con reseñas-, y dejarlos en el alta seria invitar a mentir.
 */
export interface NewTrainer {
  profileId: string
  firstName: string
  lastName: string
  email: string
  bio?: string
  yearsExperience?: number
}
