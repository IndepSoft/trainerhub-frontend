import { Progress } from '@/shared/ui/progress'
import { calculateLevelCompletion } from '@/domains/progress/libs/gamification.utils'
import type { StudentProgress } from '../hooks/useStudentsProgress'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface StudentProgressStripProps {
  /** `undefined` mientras carga; `null` cuando no ha entrenado nada. */
  progress: StudentProgress | null | undefined
}

/**
 * Cuánto ha entrenado un alumno, en una franja.
 *
 * VA EN LA FICHA, a la altura del pulgar. Estuvo en la tarjeta del padrón, y de
 * ahí salió con ella: el padrón se recorre para ENCONTRAR a alguien, y una
 * franja con nivel, XP y barra por cada alumno era la mitad de los 320 px que
 * hacían falta desplazar para dar con el siguiente. La fila dice cuántas
 * sesiones lleva, que es lo que distingue a quien entrena de quien se ha caído;
 * el nivel y los puntos están a un toque.
 *
 * SIN ENTRENAR NO SE PINTA UNA BARRA A CERO. Una barra vacía con «Nivel 1» se
 * lee como un mal resultado, y lo que dice es que todavía no ha pasado nada. Se
 * dice con palabras, que es lo que significa.
 */
export function StudentProgressStrip({ progress }: StudentProgressStripProps) {
  const { t, plural } = useTranslation()
  // Mientras carga no se pinta nada: un «Sin sesiones» que dura un instante y se
  // corrige solo es peor que un hueco, porque se lee y se cree.
  if (progress === undefined) return null

  if (progress === null || progress.completedSessions === 0) {
    return (
      <p className="px-5 pt-4 text-xs text-ink/40">{t('studentProgress.noSessions')}</p>
    )
  }

  const completion = calculateLevelCompletion(progress.level)

  return (
    <div className="px-5 pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">
          {t('progress.level', { level: progress.level.level })}
        </span>
        <span className="metric-figures text-xs text-ink/45">
          {plural(
            'studentProgress.sessionCount.one',
            'studentProgress.sessionCount.other',
            progress.completedSessions,
            { count: progress.completedSessions }
          )}
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
