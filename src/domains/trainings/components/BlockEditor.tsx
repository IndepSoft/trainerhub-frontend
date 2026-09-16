import { useId } from 'react'
import { BookmarkPlus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { BLOCK_METHODS, isBlockMethod } from '@/shared/domain/entities/routine'
import { PrescribedExerciseFields } from './PrescribedExerciseFields'
import type { Exercise } from '../types/training.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import type {
  BlockDraft,
  BlockDraftChanges,
  PrescribedExerciseDraftChanges,
} from '../types/routineDraft.types'
import { BLOCK_METHOD_LABEL_KEY } from '@/shared/i18n/domainLabels'

/** Registro de etiqueta del formulario, igual que el de las métricas. */
const FIELD_LABEL = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50'

interface BlockEditorProps {
  block: BlockDraft
  /** Número del bloque, empezando en 1. */
  position: number
  catalog: Exercise[]
  canRemove: boolean
  /** Falso mientras el bloque no tenga todos sus ejercicios elegidos. */
  canSaveToLibrary: boolean
  /**
   * Los ejercicios que ya estaban al abrir el formulario. Ésos arrancan
   * plegados; los que se añaden después, y los que no tienen ejercicio
   * elegido, abiertos: son los que se están escribiendo.
   */
  initialExerciseIds: ReadonlySet<string>
  onChange: (changes: BlockDraftChanges) => void
  onRemove: () => void
  onSaveToLibrary: () => void
  onAddExercise: () => void
  onRemoveExercise: (exerciseId: string) => void
  onChangeExercise: (exerciseId: string, changes: PrescribedExerciseDraftChanges) => void
}

/**
 * Editor de un bloque. Sólo presentación.
 *
 * Se edita el BLOQUE y no una lista plana de ejercicios porque el bloque es lo
 * que se ejecuta como unidad: cambiar «simple» por «superserie» cambia cómo se
 * encadenan los ejercicios y, con ello, la duración estimada de la sesión
 * entera. Un formulario que sólo pidiera ejercicios sueltos no tendría dónde
 * expresar esa decisión.
 *
 * El método y el descanso de la vuelta van EN UNA FILA: son las dos decisiones
 * del bloque, y apiladas se llevaban 150 px antes del primer ejercicio.
 */
export function BlockEditor({
  block,
  position,
  catalog,
  canRemove,
  canSaveToLibrary,
  initialExerciseIds,
  onChange,
  onRemove,
  onSaveToLibrary,
  onAddExercise,
  onRemoveExercise,
  onChangeExercise,
}: BlockEditorProps) {
  const { t } = useTranslation()
  const fieldId = useId()

  const methodFieldId = `${fieldId}-method`
  const restFieldId = `${fieldId}-rest`
  const notesFieldId = `${fieldId}-notes`

  const canRemoveExercise = block.exercises.length > 1

  return (
    <section className="rounded-block border border-cobalt-tint-3 bg-surface p-4 sm:p-5">
      <header className="flex items-center gap-2">
        <span className="metric-figures font-display text-2xl font-extrabold leading-none text-cobalt">
          {String(position).padStart(2, '0')}
        </span>
        <h3 className="font-display text-xl font-extrabold uppercase leading-none text-ink">
          {t('block.title')}
        </h3>

        <div className="ms-auto flex shrink-0 items-center">
          {/*
            Guardar en la biblioteca es un gesto, no un tramite: no pregunta el
            nombre, que se deriva del contenido y se puede cambiar despues. Se
            apaga mientras el bloque no tenga sus ejercicios elegidos, porque
            una entrada a medio rellenar no ahorra trabajo a nadie.
          */}
          <button
            type="button"
            onClick={onSaveToLibrary}
            disabled={!canSaveToLibrary}
            aria-label={t('block.saveToLibraryLabel', { position })}
            className="inline-flex size-11 items-center justify-center rounded-action text-ink/35 transition-colors hover:bg-cobalt-tint hover:text-cobalt disabled:pointer-events-none disabled:opacity-40"
          >
            <BookmarkPlus className="size-4" />
          </button>

          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={t('block.deleteLabel', { position })}
              className="inline-flex size-11 items-center justify-center rounded-action text-ink/35 transition-colors hover:bg-danger-surface hover:text-danger"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </header>

      <div className="mt-3 flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Label htmlFor={methodFieldId} className={FIELD_LABEL}>
            {t('block.method')}
          </Label>
          <Select
            value={block.method}
            onValueChange={(method) => {
              if (isBlockMethod(method)) onChange({ method })
            }}
          >
            <SelectTrigger id={methodFieldId} className="mt-1.5 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BLOCK_METHODS.map((method) => (
                <SelectItem key={method} value={method}>
                  {t(BLOCK_METHOD_LABEL_KEY[method])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* La etiqueta PARTE LÍNEA en vez de acortarse: «descanso» a secas se
            confundiría con el de cada ejercicio. La fila alinea por abajo, así
            que las dos casillas quedan a la misma altura. */}
        <div className="w-32 shrink-0">
          <Label htmlFor={restFieldId} className={FIELD_LABEL}>
            {t('block.restAfterRound')}
          </Label>
          {/* En superserie y circuito éste es el único descanso que cuenta: los
              ejercicios de dentro se encadenan sin pausa entre ellos. */}
          <Input
            id={restFieldId}
            type="number"
            inputMode="numeric"
            min={0}
            step={15}
            className="mt-1.5"
            value={block.restAfterSeconds}
            onChange={(event) => onChange({ restAfterSeconds: event.target.value })}
          />
        </div>
      </div>

      {/* La regla la pone cada ejercicio plegado: ver `CollapsibleRow`. */}
      <ul className="mt-2 border-t border-cobalt-tint-3">
        {block.exercises.map((exercise, index) => (
          <li key={exercise.id}>
            <PrescribedExerciseFields
              exercise={exercise}
              catalog={catalog}
              position={index + 1}
              canRemove={canRemoveExercise}
              defaultOpen={!initialExerciseIds.has(exercise.id) || exercise.exerciseId === ''}
              onChange={(changes) => onChangeExercise(exercise.id, changes)}
              onRemove={() => onRemoveExercise(exercise.id)}
            />
          </li>
        ))}
      </ul>

      {/* Visible «Añadir ejercicio»; el nombre accesible dice a qué bloque, y
          contiene el texto visible para que se pueda dictar. */}
      <Button
        type="button"
        variant="outline"
        className="mt-3 w-full gap-2 rounded-action"
        aria-label={t('block.addExerciseLabel', { position })}
        onClick={onAddExercise}
      >
        <Plus className="size-4" />
        {t('block.addExercise')}
      </Button>

      <div className="mt-4">
        <Label htmlFor={notesFieldId} className={FIELD_LABEL}>
          {t('block.notes')}
        </Label>
        <Textarea
          id={notesFieldId}
          className="mt-1.5"
          rows={2}
          placeholder={t('block.notesPlaceholder')}
          value={block.notes}
          onChange={(event) => onChange({ notes: event.target.value })}
        />
      </div>
    </section>
  )
}
