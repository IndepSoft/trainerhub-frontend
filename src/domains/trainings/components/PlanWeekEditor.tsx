import { useId } from 'react'
import { Trash2 } from 'lucide-react'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { CollapsibleRow } from '@/shared/components/CollapsibleRow'
import { cn } from '@/shared/lib/utils'
import { formatWeekdayList, weekdayName } from '../libs/planDraft'
import { summarizeWeek } from '../libs/plan.utils'
import type { PlanWeekDraft } from '../types/planDraft.types'
import type { PlanWeek, Routine } from '../types/training.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'

/**
 * Valor del día sin rutina.
 *
 * NO puede ser la cadena vacía: Radix reserva `''` para «sin seleccionar» y
 * lanza si un `SelectItem` la usa como valor. El descanso es una elección de
 * verdad —no es la ausencia de elección—, así que necesita su propio valor y se
 * traduce a `''` en la frontera de este componente.
 */
const REST_VALUE = 'descanso'

interface PlanWeekEditorProps {
  week: PlanWeekDraft
  /**
   * La misma semana tal y como quedaría guardada. De ahí sale el resumen de la
   * fila cerrada, con la misma función que la ficha del plan.
   */
  preview: PlanWeek
  /** Número de la semana, empezando en 1. Sale de la posición. */
  position: number
  routines: Routine[]
  canRemove: boolean
  /** Abierta al montar. Quien compone decide cuáles: ver `PlanForm`. */
  defaultOpen: boolean
  onRemove: () => void
  onToggleDeload: () => void
  onChangeDay: (dayOfWeek: number, routineId: string) => void
}

/**
 * Una semana del mesociclo, plegada con su resumen. Sólo presentación.
 *
 * Cerrada dice lo mismo que en la ficha —«3 sesiones · lunes, miércoles y
 * viernes»—, que es lo que hace falta para encontrar la semana que se quiere
 * tocar. Abierta, los siete días, descansos incluidos: al PROGRAMAR sí hay que
 * ver los huecos, porque cada uno es una elección.
 */
export function PlanWeekEditor({
  week,
  preview,
  position,
  routines,
  canRemove,
  defaultOpen,
  onRemove,
  onToggleDeload,
  onChangeDay,
}: PlanWeekEditorProps) {
  const { t, plural } = useTranslation()
  const fieldId = useId()
  const { trainingDays } = summarizeWeek(preview)
  const sessions = plural('plan.sessionCount.one', 'plan.sessionCount.other', trainingDays.length, {
    count: trainingDays.length,
  })

  return (
    <CollapsibleRow
      headingLevel={3}
      title={t('plan.weekLabel', { number: String(position).padStart(2, '0') })}
      meta={
        trainingDays.length === 0
          ? t('plan.noSessionsWeek')
          : `${sessions} · ${formatWeekdayList(trainingDays)}`
      }
      trailing={
        week.isDeload ? (
          <span className="shrink-0 rounded-action border border-ember/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ember-deep">
            {t('plan.deload')}
          </span>
        ) : undefined
      }
      defaultOpen={defaultOpen}
    >
      <div className="flex items-center gap-1">
        {/*
          Conmutador con `aria-pressed`, no una casilla: son dos estados de la
          semana y se lee mejor como una marca que como un formulario dentro
          de otro.
        */}
        <button
          type="button"
          aria-pressed={week.isDeload}
          onClick={onToggleDeload}
          className={cn(
            'inline-flex min-h-11 items-center rounded-action border px-3 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors',
            week.isDeload
              ? 'border-ember/50 bg-ember/10 text-ember-deep'
              : 'border-cobalt-tint-3 text-ink/45 hover:border-cobalt/40 hover:text-ink'
          )}
        >
          {t('plan.deload')}
        </button>

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={t('plan.deleteWeekLabel', { position })}
            className="ms-auto inline-flex size-11 items-center justify-center rounded-action text-ink/35 transition-colors hover:bg-danger-surface hover:text-danger"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      {/*
        La marca de descarga es HOY SOLO UN ROTULO: el modelo no puede expresar
        «lo mismo con menos volumen», porque la prescripcion vive dentro de la
        rutina y la semana solo apunta a ella. Para descargar de verdad hay que
        asignar una rutina mas ligera.

        Nota al margen con una regla, no una caja: con caja quedaba bajo el
        minimo de 280 px de la regla 1.6, que mide contenedores.
      */}
      {week.isDeload && (
        <p className="mt-3 border-s-2 border-ember/40 ps-3 text-xs text-ink/60">
          {t('plan.deloadNote')}
        </p>
      )}

      <ul className="mt-2 divide-y divide-cobalt-tint-3">
        {week.days.map((day) => {
          const dayFieldId = `${fieldId}-day-${day.dayOfWeek}`

          return (
            <li
              key={day.dayOfWeek}
              className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-center sm:gap-4"
            >
              <Label
                htmlFor={dayFieldId}
                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50 sm:w-28 sm:shrink-0 sm:text-sm sm:normal-case sm:tracking-normal sm:text-ink/70"
              >
                {weekdayName(day.dayOfWeek)}
              </Label>

              <Select
                value={day.routineId === '' ? REST_VALUE : day.routineId}
                onValueChange={(value) =>
                  onChangeDay(day.dayOfWeek, value === REST_VALUE ? '' : value)
                }
              >
                <SelectTrigger id={dayFieldId} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={REST_VALUE}>{t('plan.rest')}</SelectItem>
                  {routines.map((routine) => (
                    <SelectItem key={routine.id} value={routine.id}>
                      {routine.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </li>
          )
        })}
      </ul>
    </CollapsibleRow>
  )
}
