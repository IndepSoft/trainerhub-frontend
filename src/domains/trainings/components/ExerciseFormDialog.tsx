import { useId, type FormEvent } from 'react'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
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
import { cn } from '@/shared/lib/utils'
import { useExerciseDraft } from '../hooks/useExerciseDraft'
import { useTrainingCatalog } from '../hooks/useTrainingCatalog'
import type { Exercise } from '../types/training.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { catalogLabel } from '@/shared/i18n/domainLabels'

/** Registro de etiqueta del formulario, igual que en el resto del dominio. */
const FIELD_LABEL = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50'

interface ExerciseFormDialogProps {
  open: boolean
  /** El ejercicio que se edita, o `null` para dar uno de alta. */
  exercise: Exercise | null
  onOpenChange: (open: boolean) => void
  onSave: (data: Omit<Exercise, 'id'>) => void
}

/**
 * Alta y edición de un ejercicio, en diálogo.
 *
 * El formulario va en un componente aparte montado con `key`: el borrador se
 * inicializa una sola vez a partir del ejercicio recibido, así que si la misma
 * instancia se reutilizara para editar otro seguiría mostrando el primero. La
 * clave fuerza una instancia nueva por ejercicio, que es lo que hace que «crear»
 * y «editar» puedan ser el mismo formulario sin una condición dentro.
 */
export function ExerciseFormDialog({
  open,
  exercise,
  onOpenChange,
  onSave,
}: ExerciseFormDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto p-0">
        <DialogHeader className="px-5 pt-5 text-left">
          <DialogTitle className="font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
            {exercise === null ? t('exercise.newTitle') : t('exercise.editTitle')}
          </DialogTitle>
          <DialogDescription className="text-sm text-ink/50">
            {exercise === null
              ? t('exercise.newHint')
              : t('exercise.editHint')}
          </DialogDescription>
        </DialogHeader>

        <ExerciseForm
          key={exercise?.id ?? 'nuevo'}
          exercise={exercise}
          onSave={onSave}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

interface ExerciseFormProps {
  exercise: Exercise | null
  onSave: (data: Omit<Exercise, 'id'>) => void
  onCancel: () => void
}

function ExerciseForm({ exercise, onSave, onCancel }: ExerciseFormProps) {
  const { t } = useTranslation()
  const fieldId = useId()
  const { equipment, muscleGroupsById, movementPatternsById } = useTrainingCatalog()
  const { draft, errors, update, toggleSecondaryMuscleGroup, submit } = useExerciseDraft(exercise)

  const muscleGroups = [...muscleGroupsById.values()]
  const movementPatterns = [...movementPatternsById.values()]

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const data = submit()
    if (data === null) return

    onSave(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-5 pb-5">
      <div>
        <Label htmlFor={`${fieldId}-name`} className={FIELD_LABEL}>
          {t('exercise.name')}
        </Label>
        <Input
          id={`${fieldId}-name`}
          className="mt-1.5"
          placeholder={t('exercise.namePlaceholder')}
          value={draft.name}
          onChange={(event) => update({ name: event.target.value })}
          aria-invalid={errors.name !== undefined}
        />
        <FieldError message={errors.name} />
      </div>

      {/*
        El nombre lleva el material dentro a proposito: «press de banca con
        barra» y «con mancuernas» son entradas distintas, porque tienen distinta
        estabilizacion y distinta progresion de carga.
      */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CatalogSelect
          id={`${fieldId}-equipment`}
          label={t('exercise.equipment')}
          placeholder={t('exercise.equipmentPlaceholder')}
          value={draft.equipmentId}
          error={errors.equipmentId}
          options={equipment}
          onChange={(equipmentId) => update({ equipmentId })}
        />

        <CatalogSelect
          id={`${fieldId}-pattern`}
          label={t('exercise.pattern')}
          placeholder={t('exercise.patternPlaceholder')}
          value={draft.movementPatternId}
          error={errors.movementPatternId}
          options={movementPatterns}
          onChange={(movementPatternId) => update({ movementPatternId })}
        />
      </div>

      <CatalogSelect
        id={`${fieldId}-primary`}
        label={t('exercise.primaryMuscle')}
        placeholder={t('exercise.primaryMusclePlaceholder')}
        value={draft.primaryMuscleGroupId}
        error={errors.primaryMuscleGroupId}
        options={muscleGroups}
        onChange={(primaryMuscleGroupId) => update({ primaryMuscleGroupId })}
      />

      {/*
        Multiple de verdad, asi que conmutadores con `aria-pressed` y no un
        desplegable: el material y el patron son uno solo, pero los secundarios
        son varios y verlos todos a la vez es lo que permite decidir.
      */}
      <div role="group" aria-label={t('exercise.secondaryMusclesLabel')}>
        <span className={cn('block', FIELD_LABEL)}>{t('exercise.secondaryMuscles')}</span>
        <p className="mt-1 text-xs text-ink/40">
          {t('exercise.secondaryHint')}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {muscleGroups
            .filter((muscleGroup) => muscleGroup.id !== draft.primaryMuscleGroupId)
            .map((muscleGroup) => {
              const isSelected = draft.secondaryMuscleGroupIds.includes(muscleGroup.id)
              return (
                <button
                  key={muscleGroup.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleSecondaryMuscleGroup(muscleGroup.id)}
                  className={cn(
                    'inline-flex min-h-11 items-center rounded-action border px-3 text-xs font-semibold transition-colors',
                    isSelected
                      ? 'border-cobalt/50 bg-cobalt-tint text-cobalt'
                      : 'border-cobalt-tint-3 text-ink/50 hover:border-cobalt/40 hover:text-ink'
                  )}
                >
                  {catalogLabel(muscleGroup.id, muscleGroup.name, t)}
                </button>
              )
            })}
        </div>
      </div>

      <div>
        <Label htmlFor={`${fieldId}-description`} className={FIELD_LABEL}>
          {t('exercise.description')}
        </Label>
        <Textarea
          id={`${fieldId}-description`}
          className="mt-1.5"
          rows={2}
          placeholder={t('exercise.descriptionPlaceholder')}
          value={draft.description}
          onChange={(event) => update({ description: event.target.value })}
        />
      </div>

      <div>
        <Label htmlFor={`${fieldId}-instructions`} className={FIELD_LABEL}>
          {t('exercise.instructions')}
        </Label>
        <p className="mt-1 text-xs text-ink/40">{t('exercise.instructionsHint')}</p>
        <Textarea
          id={`${fieldId}-instructions`}
          className="mt-1.5"
          rows={4}
          placeholder={t('exercise.instructionsPlaceholder')}
          value={draft.instructions}
          onChange={(event) => update({ instructions: event.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit">
          {exercise === null ? t('exercise.addToCatalog') : t('exercise.saveChanges')}
        </Button>
      </div>
    </form>
  )
}

interface FieldErrorProps {
  message?: string
}

function FieldError({ message }: FieldErrorProps) {
  if (message === undefined) return null
  return <p className="mt-1.5 text-sm text-danger">{message}</p>
}

interface CatalogSelectProps {
  id: string
  label: string
  placeholder: string
  value: string
  error?: string
  options: { id: string; name: string }[]
  onChange: (value: string) => void
}

/**
 * Desplegable sobre una tabla del catálogo.
 *
 * Los cuatro que usa este formulario se pintan igual y sólo cambian en sus
 * datos, así que existe una vez. Acepta cualquier cosa con `id` y `name`, que
 * es lo único que necesita: no tiene por qué conocer si detrás hay material,
 * patrones o grupos musculares.
 */
function CatalogSelect({
  id,
  label,
  placeholder,
  value,
  error,
  options,
  onChange,
}: CatalogSelectProps) {
  const { t } = useTranslation()
  return (
    <div>
      <Label htmlFor={id} className={FIELD_LABEL}>
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="mt-1.5 w-full" aria-invalid={error !== undefined}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {catalogLabel(option.id, option.name, t)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError message={error} />
    </div>
  )
}
