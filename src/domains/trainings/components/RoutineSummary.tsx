import { MetricStrip } from '@/shared/components/MetricStrip'
import { MetricFigure } from '@/shared/components/MetricFigure'
import {
  countExercises,
  countTotalSets,
  estimateRoutineMinutes,
} from '../libs/routine.utils'
import type { Routine } from '../types/training.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { STUDENT_LEVEL_LABEL_KEY } from '@/shared/i18n/domainLabels'

interface RoutineSummaryProps {
  /** La rutina guardada, o tal y como quedaría si se guardase ahora. */
  routine: Routine
}

/**
 * Lo que mide una rutina. Sólo presentación.
 *
 * LA USAN LA FICHA Y EL FORMULARIO, como `PlanSummary`, y por eso dejó de
 * llamarse `RoutineDraftSummary`: le da igual si la rutina está guardada o a
 * medio escribir. Las cifras son DERIVADAS, con las mismas funciones que usa la
 * tarjeta: la duración que el entrenador ve mientras escribe es exactamente la
 * que verá después en la lista. Si cada pantalla calculara por su cuenta,
 * serían dos fórmulas que empiezan iguales y se separan al primer cambio.
 *
 * EN FRANJA DE DOS POR DOS. Apiladas, las cifras eran tres filas de 70 px y
 * los ejercicios —que son la rutina— quedaban debajo del pliegue.
 */
export function RoutineSummary({ routine }: RoutineSummaryProps) {
  const { t } = useTranslation()

  return (
    <MetricStrip columns={4} className="mx-5 mt-2">
      <MetricFigure label={t('routine.exercises')} value={countExercises(routine)} />
      <MetricFigure
        label={t('routine.duration')}
        value={estimateRoutineMinutes(routine)}
        unit={t('routine.minutes')}
      />
      <MetricFigure
        label={t('routine.series')}
        value={countTotalSets(routine)}
        unit={t('routine.seriesUnit')}
      />
      <MetricFigure label={t('routine.level')} value={t(STUDENT_LEVEL_LABEL_KEY[routine.level])} />
    </MetricStrip>
  )
}
