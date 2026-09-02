import { Progress } from '@/shared/ui/progress'
import { calculateLevelCompletion } from '@/domains/progress/libs/gamification.utils'
import type { StudentProgress } from '../hooks/useStudentsProgress'

interface StudentProgressStripProps {
  /** `undefined` mientras carga; `null` cuando no ha entrenado nada. */
  progress: StudentProgress | null | undefined
}

/**
 * Cuánto ha entrenado un alumno, en una franja.
 *
 * VA EN LA TARJETA porque es la pregunta que un entrenador se hace mirando la
 * lista —quién está entrenando y quién se ha caído—, y hasta ahora exigía abrir
 * una pantalla aparte y elegir a la persona en un desplegable. Un dato que se
 * consulta de un vistazo no puede vivir a dos clics.
 *
 * SIN ENTRENAR NO SE PINTA UNA BARRA A CERO. Una barra vacía con «Nivel 1» se
 * lee como un mal resultado, y lo que dice es que todavía no ha pasado nada. Se
 * dice con palabras, que es lo que significa.
 */
export function StudentProgressStrip({ progress }: StudentProgressStripProps) {
  // Mientras carga no se pinta nada: un «Sin sesiones» que dura un instante y se
  // corrige solo es peor que un hueco, porque se lee y se cree.
  if (progress === undefined) return null

  if (progress === null || progress.completedSessions === 0) {
    return (
      <p className="px-5 pt-4 text-xs text-ink/40">Todavía no ha completado ninguna sesión.</p>
    )
  }

  const completion = calculateLevelCompletion(progress.level)

  return (
    <div className="px-5 pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">
          Nivel {progress.level.level}
        </span>
        <span className="metric-figures text-xs text-ink/45">
          {progress.completedSessions}{' '}
          {progress.completedSessions === 1 ? 'sesión' : 'sesiones'}
        </span>
      </div>

      {/* `calculateLevelCompletion` devuelve una FRACCION de 0 a 1 y `Progress`
          espera un porcentaje: sin el factor, la barra salia vacia con 55 de
          200 XP. Y el color se lleva a Cobalt, que es el del nivel en todo el
          sistema; el `bg-primary` por defecto no es de esta paleta. */}
      <Progress
        value={completion * 100}
        className="mt-1.5 h-1.5 bg-cobalt-tint-2 [&>[data-slot=progress-indicator]]:bg-cobalt"
      />

      <p className="metric-figures mt-1 text-[11px] text-ink/40">
        {progress.level.currentExperience} / {progress.level.experienceForNextLevel} XP
      </p>
    </div>
  )
}
