import { useId } from 'react'
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
import { useTrainingCatalog } from '../hooks/useTrainingCatalog'
import type { PlanDraft, PlanDraftErrors } from '../types/planDraft.types'
import type { TrainingLevel } from '../types/training.types'

/** Registro de etiqueta del formulario, igual que en el resto del dominio. */
const FIELD_LABEL = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50'

/** De menos a más exigente, que es como se lee una escala. */
const TRAINING_LEVELS: TrainingLevel[] = ['Principiante', 'Intermedio', 'Avanzado']

interface PlanIdentityFieldsProps {
  draft: PlanDraft
  errors: PlanDraftErrors
  onChange: (changes: Partial<PlanDraft>) => void
  onLevelChange: (level: TrainingLevel) => void
}

/**
 * Lo que identifica al plan: nombre, descripción, objetivo, división,
 * frecuencia y nivel. Sólo presentación.
 *
 * La división y la frecuencia van juntas y son cosas distintas, que es
 * precisamente lo que se confundía antes: la división dice CÓMO se reparte el
 * cuerpo entre sesiones; la frecuencia, cuántas veces por semana se entrena cada
 * músculo. La primera es catálogo, la segunda es un número. Se muestran las
 * sesiones que asume la división elegida como referencia, sin imponerlas: el
 * entrenador puede apartarse de ellas y a menudo lo hace.
 */
export function PlanIdentityFields({
  draft,
  errors,
  onChange,
  onLevelChange,
}: PlanIdentityFieldsProps) {
  const fieldId = useId()
  const { objectivesById, splitsById } = useTrainingCatalog()

  const objectives = [...objectivesById.values()]
  const splits = [...splitsById.values()]
  const selectedSplit = splitsById.get(draft.splitId)

  return (
    <section className="rounded-block border border-cobalt-tint-3 bg-surface p-4 sm:p-5">
      <h2 className="border-b border-cobalt-tint-3 pb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
        El mesociclo
      </h2>

      <div className="mt-4">
        <Label htmlFor={`${fieldId}-title`} className={FIELD_LABEL}>
          Nombre
        </Label>
        <Input
          id={`${fieldId}-title`}
          className="mt-1.5"
          placeholder="Base de fuerza · 4 semanas"
          value={draft.title}
          onChange={(event) => onChange({ title: event.target.value })}
          aria-invalid={errors.title !== undefined}
          aria-describedby={errors.title === undefined ? undefined : `${fieldId}-title-error`}
        />
        {errors.title !== undefined && (
          <p id={`${fieldId}-title-error`} className="mt-1.5 text-sm text-danger">
            {errors.title}
          </p>
        )}
      </div>

      <div className="mt-4">
        <Label htmlFor={`${fieldId}-description`} className={FIELD_LABEL}>
          Descripción
        </Label>
        <Textarea
          id={`${fieldId}-description`}
          className="mt-1.5"
          rows={2}
          placeholder="Qué persigue el bloque y para quién es."
          value={draft.description}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${fieldId}-objective`} className={FIELD_LABEL}>
            Objetivo
          </Label>
          <Select
            value={draft.objectiveId}
            onValueChange={(objectiveId) => onChange({ objectiveId })}
          >
            <SelectTrigger
              id={`${fieldId}-objective`}
              className="mt-1.5 w-full"
              aria-invalid={errors.objectiveId !== undefined}
            >
              <SelectValue placeholder="Qué se persigue" />
            </SelectTrigger>
            <SelectContent>
              {objectives.map((objective) => (
                <SelectItem key={objective.id} value={objective.id}>
                  {objective.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.objectiveId !== undefined && (
            <p className="mt-1.5 text-sm text-danger">{errors.objectiveId}</p>
          )}
        </div>

        <div>
          <Label htmlFor={`${fieldId}-split`} className={FIELD_LABEL}>
            División
          </Label>
          <Select value={draft.splitId} onValueChange={(splitId) => onChange({ splitId })}>
            <SelectTrigger
              id={`${fieldId}-split`}
              className="mt-1.5 w-full"
              aria-invalid={errors.splitId !== undefined}
            >
              <SelectValue placeholder="Cómo se reparte" />
            </SelectTrigger>
            <SelectContent>
              {splits.map((split) => (
                <SelectItem key={split.id} value={split.id}>
                  {split.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.splitId === undefined ? (
            selectedSplit !== undefined && (
              <p className="metric-figures mt-1.5 text-xs text-ink/40">
                Asume {selectedSplit.sessionsPerWeek} sesiones por semana.
              </p>
            )
          ) : (
            <p className="mt-1.5 text-sm text-danger">{errors.splitId}</p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${fieldId}-frequency`} className={FIELD_LABEL}>
            Frecuencia semanal
          </Label>
          {/* Cuántas veces se entrena cada músculo por microciclo. NO es lo
              mismo que las sesiones de la división. */}
          <Input
            id={`${fieldId}-frequency`}
            type="number"
            inputMode="numeric"
            min={1}
            className="mt-1.5"
            value={draft.weeklyFrequency}
            onChange={(event) => onChange({ weeklyFrequency: event.target.value })}
            aria-invalid={errors.weeklyFrequency !== undefined}
          />
          {errors.weeklyFrequency === undefined ? (
            <p className="mt-1.5 text-xs text-ink/40">Veces por semana que se toca cada músculo.</p>
          ) : (
            <p className="mt-1.5 text-sm text-danger">{errors.weeklyFrequency}</p>
          )}
        </div>

        <div>
          <Label htmlFor={`${fieldId}-level`} className={FIELD_LABEL}>
            Nivel
          </Label>
          <Select value={draft.level} onValueChange={(value) => onLevelChange(value as TrainingLevel)}>
            <SelectTrigger id={`${fieldId}-level`} className="mt-1.5 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRAINING_LEVELS.map((candidate) => (
                <SelectItem key={candidate} value={candidate}>
                  {candidate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  )
}
