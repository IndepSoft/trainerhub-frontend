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
}
