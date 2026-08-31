import type { Routine } from '../entities/routine'

/**
 * Puerto de acceso a rutinas.
 *
 * Nace ahora y no antes porque hasta ahora sólo lo necesitaba `trainings`, y un
 * puerto para un consumidor único es la forma del patrón sin su razón. La agenda
 * ya puede colgar una rutina de una sesión, así que hay dos dominios leyendo lo
 * mismo: o comparten puerto, o uno importa del otro.
 *
 * `findById` devuelve `null` cuando no existe, no una excepción: la ausencia es
 * un resultado válido —un enlace viejo, un plan que apunta a algo borrado— y así
 * lo declaran también `TrainerRepository` y `StudentRepository`.
 */
export interface RoutineRepository {
  findAll(): Promise<Routine[]>
  findById(routineId: string): Promise<Routine | null>
  /** Devuelve la rutina ya identificada: el `id` lo pone el almacén. */
  create(data: Omit<Routine, 'id'>): Promise<Routine>
  update(routineId: string, data: Omit<Routine, 'id'>): Promise<void>
  remove(routineId: string): Promise<void>

  /**
   * Avisa de que la colección ha cambiado. Devuelve la función de baja.
   *
   * Es la misma forma que `AuthPort.onAuthStateChange`, y existe por el mismo
   * motivo: sin ella, una lista ya montada no se entera de lo que otra vista
   * acaba de crear o borrar, y la alternativa —refrescar a mano desde cada sitio
   * que muta— reparte por la aplicación una responsabilidad del almacén.
   *
   * El adaptador falso la cumple notificando en cada escritura. Un backend real
   * la cumpliría con realtime, o con un no-op si se decide recargar a mano; en
   * ambos casos el consumidor no cambia.
   */
  onChange(listener: () => void): () => void
}
