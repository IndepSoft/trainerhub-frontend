import type { StudentSubscription } from '../entities/studentSubscription'

/**
 * Puerto de las cuotas de los alumnos.
 *
 * Acotado al crew activo, como todo lo demás: el ámbito no aparece en ninguna
 * firma. Ver `CrewScope`.
 *
 * Puerto propio y no dos campos más en `Student` por segregación de interfaces:
 * quien pinta una ficha no necesita poder cobrar, y quien lleva los cobros no
 * necesita poder editar la edad de nadie. Además la cuota tiene su propio ritmo
 * —cambia cada mes— y la ficha casi nunca cambia.
 */
export interface SubscriptionRepository {
  /** Las cuotas del crew activo. Sin entrada = ese alumno no tiene ninguna. */
  findAll(): Promise<StudentSubscription[]>

  /**
   * Deja la cuota de alguien como se le indique.
   *
   * Una sola operación de escritura porque son una sola decisión: «este alumno
   * paga cada tanto y tiene hasta tal día». Partirla en «crear» y «renovar»
   * obligaría a quien llama a saber si ya existía, que es cosa del almacén.
   */
  save(subscription: StudentSubscription): Promise<void>

  onChange(listener: () => void): () => void
}
