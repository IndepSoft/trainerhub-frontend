import { MilestoneNode } from './MilestoneNode'
import type { Milestone } from '../types/gamification.types'

interface MilestonePathProps {
  milestones: Milestone[]
}

/**
 * El sendero: elemento firma del registro de gamificación.
 *
 * Es una lista ordenada con una línea continua, no una pila de tarjetas. La
 * diferencia importa: una pila de cajas iguales no dice que haya un orden ni un
 * punto donde estás; una línea con nodos lo dice sin una palabra.
 */
export function MilestonePath({ milestones }: MilestonePathProps) {
  return (
    // Ancho acotado: un sendero es una lectura vertical. Estirado a lo ancho
    // de una pantalla de escritorio, las barras de progreso pasan de 250 a
    // 1000 px y dejan de leerse como una barra.
    <section className="mx-auto w-full max-w-2xl px-5 py-6">
      <h2 className="mb-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/50">
        Tu camino
      </h2>

      <ol className="relative">
        {milestones.map((milestone, index) => (
          <MilestoneNode
            key={milestone.id}
            milestone={milestone}
            isLast={index === milestones.length - 1}
            leadsToLocked={milestones[index + 1]?.state === 'locked'}
          />
        ))}
      </ol>
    </section>
  )
}
