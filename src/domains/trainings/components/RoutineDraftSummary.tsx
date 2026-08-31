import {
  countExercises,
  countTotalSets,
  estimateRoutineMinutes,
} from '../libs/routine.utils'
import type { Routine } from '../types/training.types'

interface RoutineDraftSummaryProps {
  /** La rutina tal y como quedaría si se guardase ahora. */
  routine: Routine
}

/**
 * Lo que la rutina mide mientras se escribe. Sólo presentación.
 *
 * Las tres cifras son DERIVADAS, con las mismas funciones que usan la tarjeta y
 * la ficha. Es lo que hace que la duración estimada que el entrenador ve aquí
 * sea exactamente la que verá después en la lista: si este resumen calculara por
 * su cuenta, tendríamos dos fórmulas que empiezan iguales y se separan al primer
 * cambio.
 *
 * Va en la misma rejilla de tres columnas con reglas de 1 px que la ficha de
 * rutina, para que crear y consultar se lean como la misma cosa.
 */
export function RoutineDraftSummary({ routine }: RoutineDraftSummaryProps) {
  return (
    <dl className="grid grid-cols-1 divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      <div className="flex flex-col gap-2 px-5 py-5">
        <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">
          Ejercicios
        </dt>
        <dd className="metric-figures font-display text-3xl font-extrabold leading-none text-ink">
          {countExercises(routine)}
        </dd>
      </div>

      <div className="flex flex-col gap-2 px-5 py-5">
        <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">
          Duración estimada
        </dt>
        <dd className="metric-figures font-display text-3xl font-extrabold leading-none text-ink">
          {estimateRoutineMinutes(routine)}
          <span className="ml-1 text-lg font-bold text-ink/45">min</span>
        </dd>
      </div>

      <div className="flex flex-col gap-2 px-5 py-5">
        <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">
          Series totales
        </dt>
        <dd className="metric-figures font-display text-3xl font-extrabold leading-none text-ink">
          {countTotalSets(routine)}
        </dd>
      </div>
    </dl>
  )
}
