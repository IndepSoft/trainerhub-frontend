import { countTotalSets, estimateRoutineMinutes } from '../libs/routine.utils'
import type { Routine } from '../types/training.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { STUDENT_LEVEL_LABEL_KEY } from '@/shared/i18n/domainLabels'

interface RoutineDraftLineProps {
  /** La rutina tal y como quedaría si se guardase ahora. */
  routine: Routine
}

/**
 * Lo que la rutina mide mientras se escribe, en UNA LÍNEA.
 *
 * En el formulario, y no la franja de la ficha: aquí acompaña a cada paso, y
 * cuatro cifras en dos filas se llevaban 120 px de la pantalla en la que se
 * escribe. La duración es la cifra que decide si la sesión cabe en el hueco de
 * la agenda, y verla cambiar al añadir series es lo que evita descubrirlo al
 * guardar.
 *
 * Las cifras salen de las MISMAS funciones que la franja de la ficha y la
 * tarjeta, así que lo que se ve al escribir es lo que queda guardado.
 *
 * SÓLO LAS CIFRAS SON UNA REGIÓN VIVA (`role="status"`). El nombre, a su
 * izquierda, cambia con cada tecla, y un lector de pantalla lo anunciaría
 * letra a letra.
 */
export function RoutineDraftLine({ routine }: RoutineDraftLineProps) {
  const { t, plural } = useTranslation()
  const sets = countTotalSets(routine)
  const title = routine.title.trim()

  return (
    <div className="flex items-baseline justify-between gap-3 text-xs text-ink/60">
      <span className="min-w-0 truncate">
        {title !== '' && <strong className="font-semibold text-ink">{title}</strong>}
        {title !== '' && ' · '}
        {t(STUDENT_LEVEL_LABEL_KEY[routine.level])}
      </span>
      <span
        role="status"
        aria-label={t('routine.liveSummary')}
        className="metric-figures shrink-0 whitespace-nowrap"
      >
        {plural('routine.draftFigures.one', 'routine.draftFigures.other', sets, {
          minutes: estimateRoutineMinutes(routine),
          sets,
        })}
      </span>
    </div>
  )
}
