import { Satellite } from 'lucide-react'
import { useLiveSession } from '../hooks/useLiveSession'
import { SessionDuration } from '../components/SessionDuration'
import { SessionMetrics } from '../components/SessionMetrics'
import { SessionRouteMap } from '../components/SessionRouteMap'
import { SlideToAction } from '../components/SlideToAction'

/**
 * Sesión en vivo. Sólo composición: todo el estado está en `useLiveSession` y
 * todos los cálculos en `session.utils`.
 */
export default function LiveSession() {
  const { session, metrics, state, paceSeconds, routeProgress, pause, resume } =
    useLiveSession()

  const isRunning = state === 'running'

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      <header className="flex shrink-0 items-center justify-between px-5 pt-5 pb-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/45">
            {session.studentName}
          </p>
          <h1 className="truncate font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
            {session.title}
          </h1>
        </div>

        <span className="flex shrink-0 items-center gap-1.5 text-cobalt">
          <Satellite className="size-4" strokeWidth={2.25} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">GPS</span>
        </span>
      </header>

      {/*
        En movil todo va apilado y la pagina se desplaza. Desde `lg` pasa a dos
        columnas: estirar la duracion y el mapa a lo ancho de una pantalla de
        escritorio dejaba las metricas flotando en 1150 px y el mapa cortado
        por la franja inferior. La sesion en vivo es una experiencia de
        telefono; en ancho se reparte, no se estira.
      */}
      <div className="flex-1 overflow-auto lg:grid lg:grid-cols-2 lg:items-stretch lg:overflow-hidden">
        <div className="flex flex-col lg:justify-center lg:border-r lg:border-cobalt-tint-3">
          <SessionDuration elapsedSeconds={metrics.elapsedSeconds} state={state} />
          <SessionMetrics metrics={metrics} paceSeconds={paceSeconds} />
        </div>

        <div className="flex items-center justify-center border-t border-cobalt-tint-3 bg-cobalt-tint p-6 lg:border-t-0 lg:min-h-0">
          <div className="aspect-square w-full max-w-sm lg:max-h-full lg:w-auto lg:h-full">
            <SessionRouteMap route={session.route} progress={routeProgress} />
          </div>
        </div>
      </div>

      <SlideToAction
        label={isRunning ? 'Desliza para pausar' : 'Desliza para reanudar'}
        accessibleLabel={isRunning ? 'Pausar la sesión' : 'Reanudar la sesión'}
        onConfirm={isRunning ? pause : resume}
      />
    </div>
  )
}
