import { Satellite } from 'lucide-react'
import { useLiveSession } from '../hooks/useLiveSession'
import { SessionDuration } from './SessionDuration'
import { SessionMetrics } from './SessionMetrics'
import { SessionRouteMap } from './SessionRouteMap'
import { SlideToAction } from './SlideToAction'
import type { Session } from '@/shared/domain/entities/session'

interface CardioSessionProps {
  session: Session
  studentName: string
  onFinish: () => void
}

/**
 * Sesión de cardio en marcha: cronómetro, distancia, ritmo y trazado.
 *
 * Es la pantalla en vivo que había, conservada entera. Lo que cambió es que ya
 * no es LA pantalla: era la única, así que una sesión de fuerza —bloques, series
 * y RIR— acababa mostrando un mapa de GPS. Ahora sólo la usan las sesiones cuya
 * modalidad es cardio.
 *
 * El trazado y las métricas siguen simulados: no hay GPS detrás. Lo real es de
 * qué sesión se trata y de quién es.
 */
export function CardioSession({ session, studentName, onFinish }: CardioSessionProps) {
  const { session: simulated, metrics, state, paceSeconds, routeProgress, pause, resume, finish } =
    useLiveSession()

  const isRunning = state === 'running'

  /*
   * Finalizar cierra la sesion de verdad -pasa a completada- ademas de llevar a
   * la celebracion. El gesto de deslizar protege aqui con mas motivo: terminar
   * por error una sesion en marcha no tiene vuelta atras. Solo aparece en pausa,
   * para que no compita con la accion principal.
   */
  const handleFinish = () => {
    finish()
    onFinish()
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      <header className="flex shrink-0 items-center justify-between px-5 pt-5 pb-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/45">
            {studentName}
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
            <SessionRouteMap route={simulated.route} progress={routeProgress} />
          </div>
        </div>
      </div>

      {/* El margen de zona segura va aqui y no en cada franja: con dos
          apiladas, aplicarlo a ambas dejaria un hueco entre ellas. En una
          PWA instalada esto es lo que evita chocar con la barra de gestos. */}
      <div className="shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {!isRunning && (
          <SlideToAction
            variant="finish"
            label="Desliza para finalizar"
            accessibleLabel="Finalizar la sesión"
            onConfirm={handleFinish}
          />
        )}

        <SlideToAction
          label={isRunning ? 'Desliza para pausar' : 'Desliza para reanudar'}
          accessibleLabel={isRunning ? 'Pausar la sesión' : 'Reanudar la sesión'}
          onConfirm={isRunning ? pause : resume}
        />
      </div>
    </div>
  )
}
