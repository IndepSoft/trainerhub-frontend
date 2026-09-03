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
import { cn } from '@/shared/lib/utils'
import { weekdayName } from '../libs/planDraft'
import type { PlanWeekDraft } from '../types/planDraft.types'
import type { Routine } from '../types/training.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'

/** Registro de etiqueta del formulario, igual que en el resto del dominio. */
const FIELD_LABEL = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50'

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
  /** Número de la semana, empezando en 1. Sale de la posición. */
  position: number
  routines: Routine[]
  canRemove: boolean
  onRemove: () => void
  onToggleDeload: () => void
  onChangeDay: (dayOfWeek: number, routineId: string) => void
}

/**
 * Una semana del mesociclo. Sólo presentación.
 *
 * Los siete días se listan siempre, incluidos los de descanso: un microciclo son
 * siete días y ver los huecos es parte de programar. Ocultar los vacíos haría
 * que «entreno lunes, miércoles y viernes» y «entreno tres días seguidos» se
 * vieran igual.
 */
export function PlanWeekEditor({
  week,
  position,
  routines,
  canRemove,
  onRemove,
  onToggleDeload,
  onChangeDay,
}: PlanWeekEditorProps) {
  const { t } = useTranslation()
  const fieldId = useId()

  return (
    <section className="rounded-block border border-cobalt-tint-3 bg-surface p-4 sm:p-5">
      <header className="flex items-center gap-3 border-b border-cobalt-tint-3 pb-4">
        <span className="metric-figures font-display text-2xl font-extrabold leading-none text-cobalt">
          {String(position).padStart(2, '0')}
        </span>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
          {t('plan.week')}
        </h3>

        <div className="ms-auto flex shrink-0 items-center gap-1">
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
              className="inline-flex size-11 items-center justify-center rounded-action text-ink/35 transition-colors hover:bg-danger-surface hover:text-danger"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </header>

      {/*
        La marca de descarga es HOY SOLO UN ROTULO: el modelo no puede expresar
        «lo mismo con menos volumen», porque la prescripcion vive dentro de la
        rutina y la semana solo apunta a ella. Para descargar de verdad hay que
        asignar una rutina mas ligera. Esta anotado como deuda en el traspaso.
      */}
      {week.isDeload && (
        /*
          Nota al margen con una regla, no una caja. Con caja quedaba en 269 px
          -la pagina pone 20, la tarjeta de semana 16- y caia bajo el minimo de
          280 de la regla 1.6, que mide contenedores. Un parrafo no es un
          contenedor, y en cuanto deja de parecerlo tampoco lo aparenta: son
          245 px de texto, unos cuarenta caracteres por linea.
        */
        <p className="mt-4 border-s-2 border-ember/40 ps-3 text-xs text-ink/60">
          Marcarla como descarga no reduce el volumen por sí solo: asigna rutinas más
          ligeras a estos días.
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
                className={cn(FIELD_LABEL, 'sm:w-28 sm:shrink-0 sm:normal-case sm:tracking-normal sm:text-sm sm:text-ink/70')}
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
    </section>
  )
}
