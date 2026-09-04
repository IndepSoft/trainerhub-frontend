import { useMemo, useState } from 'react'
import { AlertCircle, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useTrainingCatalog } from '../hooks/useTrainingCatalog'
import { useCatalogEditor } from '../hooks/useCatalogEditor'
import { useRoutines } from '../hooks/useRoutines'
import { findRoutinesUsingExercise } from '../libs/usage'
import { ExerciseFormDialog } from './ExerciseFormDialog'
import type { Exercise } from '../types/training.types'
import { activeLocale } from '@/shared/i18n/activeLocale'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { catalogLabel } from '@/shared/i18n/domainLabels'

/**
 * El catálogo de ejercicios: listado, alta, edición y baja.
 *
 * Es la mitad del catálogo que de verdad pertenece al entrenador. Sin esto, la
 * pantalla de creación de rutinas ofrecía quince ejercicios fijos y no había
 * forma de prescribir la máquina que sí hay en el gimnasio.
 */
export function ExerciseCatalog() {
  const { t } = useTranslation()

  /* La entrada puede no existir -un ejercicio que apunta a material borrado-, y
     entonces se omite de la linea en vez de dejar un hueco. */
  const catalogEntryLabel = (entry: { id: string; name: string } | undefined) =>
    entry === undefined ? undefined : catalogLabel(entry.id, entry.name, t)
  const { exercises, muscleGroupsById, equipmentById, movementPatternsById } =
    useTrainingCatalog()
  const { routines } = useRoutines()
  const { createExercise, updateExercise, deleteExercise } = useCatalogEditor()

  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [exerciseBeingEdited, setExerciseBeingEdited] = useState<Exercise | null>(null)
  const [blockedReason, setBlockedReason] = useState<string | null>(null)

  /*
   * El recuento de uso se calcula UNA vez para toda la lista. Llamarlo por fila
   * recorreria todas las rutinas por cada ejercicio, y ademas es el dato que
   * explica por adelantado por que un borrado no va a poder ser.
   */
  const usageByExercise = useMemo(() => {
    const usage = new Map<string, number>()
    for (const exercise of exercises) {
      usage.set(exercise.id, findRoutinesUsingExercise(routines, exercise.id).length)
    }
    return usage
  }, [exercises, routines])

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const matching =
      needle === ''
        ? exercises
        : exercises.filter((exercise) => exercise.name.toLowerCase().includes(needle))

    return [...matching].sort((left, right) => left.name.localeCompare(right.name, activeLocale()))
  }, [exercises, search])

  const openForNew = () => {
    setExerciseBeingEdited(null)
    setBlockedReason(null)
    setIsDialogOpen(true)
  }

  const openForEdit = (exercise: Exercise) => {
    setExerciseBeingEdited(exercise)
    setBlockedReason(null)
    setIsDialogOpen(true)
  }

  const handleSave = (data: Omit<Exercise, 'id'>) => {
    if (exerciseBeingEdited === null) {
      createExercise(data)
    } else {
      updateExercise(exerciseBeingEdited.id, data)
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (exercise: Exercise) => {
    const result = deleteExercise(exercise.id)
    setBlockedReason(
      result.deleted
        ? null
        : t('exercise.cannotDelete', { name: exercise.name, reason: result.reason })
    )
  }

  return (
    <section className="px-4 pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1 sm:max-w-xs">
          <Label htmlFor="busqueda-ejercicios" className="sr-only">
            {t('exercise.search')}
          </Label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-ink/35"
            />
            <Input
              id="busqueda-ejercicios"
              type="search"
              className="ps-9"
              placeholder={t('exercise.search')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <Button type="button" className="gap-2" onClick={openForNew}>
          <Plus className="size-4" />
          {t('exercise.new')}
        </Button>
      </div>

      {blockedReason !== null && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-block border border-danger/40 bg-danger-surface px-4 py-3 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {blockedReason}
        </p>
      )}

      {visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink/40">
          {search.trim() === ''
            ? t('exercise.emptyCatalog')
            : t('exercise.noMatch', { search: search.trim() })}
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3">
          {visible.map((exercise) => {
            const usedIn = usageByExercise.get(exercise.id) ?? 0

            return (
              <li key={exercise.id} className="flex items-start gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{exercise.name}</p>
                  <p className="mt-0.5 text-xs text-ink/45">
                    {[
                      catalogEntryLabel(muscleGroupsById.get(exercise.primaryMuscleGroupId)),
                      catalogEntryLabel(movementPatternsById.get(exercise.movementPatternId)),
                      catalogEntryLabel(equipmentById.get(exercise.equipmentId)),
                    ]
                      .filter((label) => label !== undefined)
                      .join(' · ')}
                  </p>
                  {/* Dice de antemano por que un borrado no va a poder ser. */}
                  {usedIn > 0 && (
                    <p className="metric-figures mt-1 text-xs text-cobalt">
                      En {usedIn} {usedIn === 1 ? 'rutina' : 'rutinas'}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center">
                  <button
                    type="button"
                    onClick={() => openForEdit(exercise)}
                    aria-label={t('exercise.editLabel', { name: exercise.name })}
                    className="inline-flex size-11 items-center justify-center rounded-action text-ink/35 transition-colors hover:bg-cobalt-tint hover:text-cobalt"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(exercise)}
                    aria-label={t('exercise.deleteLabel', { name: exercise.name })}
                    className="inline-flex size-11 items-center justify-center rounded-action text-ink/35 transition-colors hover:bg-danger-surface hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <ExerciseFormDialog
        open={isDialogOpen}
        exercise={exerciseBeingEdited}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
      />
    </section>
  )
}
