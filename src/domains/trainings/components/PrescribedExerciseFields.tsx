import { useId } from 'react'
import { Trash2 } from 'lucide-react'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import type { Exercise } from '../types/training.types'
import type {
  PrescribedExerciseDraft,
  PrescribedExerciseDraftChanges,
} from '../types/routineDraft.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'

/** Registro de etiqueta del formulario, igual que el de las métricas. */
const FIELD_LABEL = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50'

interface PrescribedExerciseFieldsProps {
  exercise: PrescribedExerciseDraft
  /** Catálogo completo, ya ordenado por quien compone. */
  catalog: Exercise[]
  /** Posición dentro del bloque, sólo para el nombre accesible del botón. */
  position: number
  canRemove: boolean
  onChange: (changes: PrescribedExerciseDraftChanges) => void
  onRemove: () => void
}

/**
 * Un ejercicio prescrito dentro de un bloque. Sólo presentación.
 *
 * Cada control lleva su `<label>` apuntando a un `id` real, incluido el
 * desplegable: `SelectTrigger` renderiza un `<button>`, que es un elemento
 * etiquetable, así que `htmlFor` lo alcanza. Es una comprobación que este
 * proyecto ya pagó una vez —el formulario de registro tenía etiquetas que no
 * apuntaban a ningún control— y no conviene repetir.
 *
 * `useId` y no el identificador del borrador: el mismo ejercicio puede
 * aparecer en dos sitios de la pantalla y los `id` del documento tienen que
 * ser únicos aunque el dato sea el mismo.
 */
export function PrescribedExerciseFields({
  exercise,
  catalog,
  position,
  canRemove,
  onChange,
  onRemove,
}: PrescribedExerciseFieldsProps) {
  const { t } = useTranslation()
  const fieldId = useId()

  const exerciseFieldId = `${fieldId}-exercise`
  const setsFieldId = `${fieldId}-sets`
  const repsFieldId = `${fieldId}-reps`
  const repetitionsInReserveFieldId = `${fieldId}-rir`
  const weightFieldId = `${fieldId}-weight`
  const restFieldId = `${fieldId}-rest`

  return (
    /*
      Una fila con su regla, NO una tarjeta.

      Era una tarjeta y medía 269 px a 375: la página aporta 20 px de relleno,
      el bloque otros 16 y la tarjeta del ejercicio 16 más, así que el contenido
      pagaba el relleno tres veces y caía bajo el mínimo de 280 de la regla 1.6.
      Es el mismo defecto que se corrigió en Reportes y en Progreso, y la misma
      cura: quitar el nivel de anidamiento en lugar de recortar el relleno. De
      paso queda como la ficha de rutina, que también lista los ejercicios de un
      bloque en filas separadas por una regla.
    */
    <div className="py-4">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Label htmlFor={exerciseFieldId} className={FIELD_LABEL}>
            {t('prescription.exercise')}
          </Label>
          <Select
            value={exercise.exerciseId}
            onValueChange={(exerciseId) => onChange({ exerciseId })}
          >
            <SelectTrigger id={exerciseFieldId} className="mt-1.5 w-full">
              <SelectValue placeholder={t('prescription.exercisePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {catalog.map((candidate) => (
                <SelectItem key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/*
          El botón sólo aparece cuando hay más de un ejercicio. Deshabilitarlo
          en vez de ocultarlo dejaría un control apagado sin explicación; que un
          bloque de un solo ejercicio no ofrezca vaciarse se entiende solo.
        */}
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Quitar el ejercicio ${position}`}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-action text-ink/35 transition-colors hover:bg-danger-surface hover:text-danger"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      {/*
        Dos columnas en móvil, tres desde `sm` y las cinco desde `lg`. A 375 px
        cada campo queda en unos 140 px, que para «3» o «90» sobra: el mínimo de
        280 px de la regla 1.6 mide contenedores, no cada casilla de una rejilla
        de números.

        El salto intermedio existe porque los campos pasaron de cuatro a cinco:
        con `sm:grid-cols-4` el quinto se quedaba solo en una fila, que se lee
        como un campo desemparejado y no como el final de una rejilla.
      */}
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div>
          <Label htmlFor={setsFieldId} className={FIELD_LABEL}>
            {t('prescription.sets')}
          </Label>
          <Input
            id={setsFieldId}
            type="number"
            inputMode="numeric"
            min={1}
            className="mt-1.5"
            value={exercise.sets}
            onChange={(event) => onChange({ sets: event.target.value })}
          />
        </div>

        <div>
          <Label htmlFor={repsFieldId} className={FIELD_LABEL}>
            {t('prescription.reps')}
          </Label>
          {/* Texto y no número: «8-10» es una prescripción válida y corriente. */}
          <Input
            id={repsFieldId}
            type="text"
            className="mt-1.5"
            placeholder={t('prescription.repsPlaceholder')}
            value={exercise.reps}
            onChange={(event) => onChange({ reps: event.target.value })}
          />
        </div>

        <div>
          <Label htmlFor={repetitionsInReserveFieldId} className={FIELD_LABEL}>
            {t('prescription.rir')}
          </Label>
          {/* Vacío es «no aplica»; 0 es «al fallo». El marcador lo dice. */}
          <Input
            id={repetitionsInReserveFieldId}
            type="number"
            inputMode="numeric"
            min={0}
            className="mt-1.5"
            placeholder={t('prescription.rirPlaceholder')}
            value={exercise.rir}
            onChange={(event) => onChange({ rir: event.target.value })}
          />
        </div>

        {/*
          EL PESO ES OPCIONAL Y NO CONTRADICE AL RIR: el RIR prescribe esfuerzo
          y esto prescribe dónde empezar. Vacío significa «que lo decida quien
          entrena», que es lo que ocurría antes de que este campo existiera.

          Texto y no `type="number"`: el teclado del móvil ofrece el separador
          decimal del idioma del teléfono, y un campo numérico rechaza «62,5» en
          varios navegadores. Se acepta coma o punto al convertir.
        */}
        <div>
          <Label htmlFor={weightFieldId} className={FIELD_LABEL}>
            {t('prescription.weight')}
          </Label>
          <Input
            id={weightFieldId}
            type="text"
            inputMode="decimal"
            className="mt-1.5"
            placeholder={t('prescription.weightPlaceholder')}
            value={exercise.weightKg}
            onChange={(event) => onChange({ weightKg: event.target.value })}
          />
        </div>

        <div>
          <Label htmlFor={restFieldId} className={FIELD_LABEL}>
            {t('prescription.rest')}
          </Label>
          <Input
            id={restFieldId}
            type="number"
            inputMode="numeric"
            min={0}
            step={15}
            className="mt-1.5"
            value={exercise.restSeconds}
            onChange={(event) => onChange({ restSeconds: event.target.value })}
          />
        </div>
      </div>
    </div>
  )
}
