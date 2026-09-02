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
import { BLOCK_METHOD_LABELS } from '../libs/routine.utils'
import { PrescribedExerciseFields } from './PrescribedExerciseFields'
import type { BlockMethod, Exercise } from '../types/training.types'
import type {
  BlockDraft,
  BlockDraftChanges,
  PrescribedExerciseDraftChanges,
} from '../types/routineDraft.types'

/** Registro de etiqueta del formulario, igual que el de las métricas. */
const FIELD_LABEL = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50'

/** Los métodos, en el orden en que crece la complejidad. */
const BLOCK_METHODS: BlockMethod[] = ['simple', 'superserie', 'triserie', 'circuito']

interface BlockEditorProps {
  block: BlockDraft
  /** Número del bloque, empezando en 1. */
  position: number
  catalog: Exercise[]
  canRemove: boolean
  /** Falso mientras el bloque no tenga todos sus ejercicios elegidos. */
  canSaveToLibrary: boolean
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
 */
export function BlockEditor({
  block,
  position,
  catalog,
  canRemove,
  canSaveToLibrary,
  onChange,
  onRemove,
  onSaveToLibrary,
  onAddExercise,
  onRemoveExercise,
  onChangeExercise,
}: BlockEditorProps) {
  const fieldId = useId()

  const methodFieldId = `${fieldId}-method`
  const restFieldId = `${fieldId}-rest`
  const notesFieldId = `${fieldId}-notes`

  const canRemoveExercise = block.exercises.length > 1

  return (
    <section className="rounded-block border border-cobalt-tint-3 bg-surface p-4 sm:p-5">
      <header className="flex items-center gap-3 border-b border-cobalt-tint-3 pb-4">
        <span className="metric-figures font-display text-2xl font-extrabold leading-none text-cobalt">
          {String(position).padStart(2, '0')}
        </span>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
          Bloque
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
            aria-label={`Guardar el bloque ${position} en la biblioteca`}
            className="inline-flex size-11 items-center justify-center rounded-action text-ink/35 transition-colors hover:bg-cobalt-tint hover:text-cobalt disabled:pointer-events-none disabled:opacity-40"
          >
            <BookmarkPlus className="size-4" />
          </button>

          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Eliminar el bloque ${position}`}
              className="inline-flex size-11 items-center justify-center rounded-action text-ink/35 transition-colors hover:bg-danger-surface hover:text-danger"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </header>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={methodFieldId} className={FIELD_LABEL}>
            Método
          </Label>
          <Select
            value={block.method}
            onValueChange={(method) => onChange({ method: method as BlockMethod })}
          >
            <SelectTrigger id={methodFieldId} className="mt-1.5 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BLOCK_METHODS.map((method) => (
                <SelectItem key={method} value={method}>
                  {BLOCK_METHOD_LABELS[method]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor={restFieldId} className={FIELD_LABEL}>
            Descanso tras la ronda (s)
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

      {/* Reglas de 1 px entre ejercicios en vez de una tarjeta por ejercicio:
          ver el motivo en `PrescribedExerciseFields`. */}
      <ul className="mt-2 divide-y divide-cobalt-tint-3 border-t border-cobalt-tint-3">
        {block.exercises.map((exercise, index) => (
          <li key={exercise.id}>
            <PrescribedExerciseFields
              exercise={exercise}
              catalog={catalog}
              position={index + 1}
              canRemove={canRemoveExercise}
              onChange={(changes) => onChangeExercise(exercise.id, changes)}
              onRemove={() => onRemoveExercise(exercise.id)}
            />
          </li>
        ))}
      </ul>

      <Button
        type="button"
        variant="outline"
        className="mt-3 w-full gap-2"
        onClick={onAddExercise}
      >
        <Plus className="size-4" />
        Añadir ejercicio al bloque {position}
      </Button>

      <div className="mt-4">
        <Label htmlFor={notesFieldId} className={FIELD_LABEL}>
          Notas del bloque
        </Label>
        <Textarea
          id={notesFieldId}
          className="mt-1.5"
          rows={2}
          placeholder="Indicaciones de ejecución, material, avisos…"
          value={block.notes}
          onChange={(event) => onChange({ notes: event.target.value })}
        />
      </div>
    </section>
  )
}
