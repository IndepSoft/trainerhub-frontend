import { useCallback, useMemo, useState } from 'react'
import {
  createEmptyPlanDraft,
  createWeekDraftFrom,
  hasPlanDraftErrors,
  toPlanData,
  toPlanDraft,
  toPlanPreview,
  validatePlanDraft,
} from '../libs/planDraft'
import type { NewPlan } from '@/shared/domain/ports/PlanRepository'
import type { PlanDraft, PlanDraftErrors } from '../types/planDraft.types'
import type { TrainingLevel, TrainingPlan } from '../types/training.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'

type PlanIdentityChanges = Partial<
  Pick<
    PlanDraft,
    'title' | 'description' | 'objectiveId' | 'splitId' | 'weeklyFrequency' | 'level'
  >
>

interface UsePlanDraftResult {
  draft: PlanDraft
  /** Vacío mientras no se ha intentado guardar. */
  errors: PlanDraftErrors
  /** El plan tal y como quedaría, para el resumen en vivo. */
  preview: TrainingPlan
  /** Falso cuando queda una sola semana: un plan sin semanas no es nada. */
  canRemoveWeek: boolean
  update: (changes: PlanIdentityChanges) => void
  setLevel: (level: TrainingLevel) => void
  addWeek: () => void
  removeWeek: (weekId: string) => void
  toggleDeload: (weekId: string) => void
  setDayRoutine: (weekId: string, dayOfWeek: number, routineId: string) => void
  /** Los datos listos para guardar, o `null` si el borrador no es válido. */
  submit: () => NewPlan | null
}

/**
 * Estado del formulario de plan, para alta y para edición.
 *
 * Igual que `useRoutineDraft` y `useExerciseDraft`: recibe el plan de partida o
 * nada, y `submit` devuelve datos sin identificador. Quién los guarda —y si es
 * un alta o una actualización— lo decide quien llama, así que el mismo
 * formulario sirve para las dos cosas sin una condición dentro.
 */
export function usePlanDraft(initial: TrainingPlan | null): UsePlanDraftResult {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<PlanDraft>(() =>
    initial === null ? createEmptyPlanDraft() : toPlanDraft(initial)
  )
  const [wasSubmitted, setWasSubmitted] = useState(false)

  const errors = useMemo(
    () => (wasSubmitted ? validatePlanDraft(draft, t) : {}),
    [draft, wasSubmitted, t]
  )

  const preview = useMemo(() => toPlanPreview(draft), [draft])

  const update = useCallback((changes: PlanIdentityChanges) => {
    setDraft((current) => ({ ...current, ...changes }))
  }, [])

  const setLevel = useCallback((level: TrainingLevel) => {
    setDraft((current) => ({ ...current, level }))
  }, [])

  const addWeek = useCallback(() => {
    setDraft((current) => ({
      ...current,
      // Copia la última: en un mesociclo la estructura se repite. Ver `planDraft`.
      weeks: [...current.weeks, createWeekDraftFrom(current.weeks.at(-1))],
    }))
  }, [])

  const removeWeek = useCallback((weekId: string) => {
    setDraft((current) => ({
      ...current,
      weeks: current.weeks.filter((week) => week.id !== weekId),
    }))
  }, [])

  const toggleDeload = useCallback((weekId: string) => {
    setDraft((current) => ({
      ...current,
      weeks: current.weeks.map((week) =>
        week.id === weekId ? { ...week, isDeload: !week.isDeload } : week
      ),
    }))
  }, [])

  const setDayRoutine = useCallback((weekId: string, dayOfWeek: number, routineId: string) => {
    setDraft((current) => ({
      ...current,
      weeks: current.weeks.map((week) =>
        week.id === weekId
          ? {
              ...week,
              days: week.days.map((day) =>
                day.dayOfWeek === dayOfWeek ? { ...day, routineId } : day
              ),
            }
          : week
      ),
    }))
  }, [])

  const submit = useCallback((): NewPlan | null => {
    setWasSubmitted(true)

    const validation = validatePlanDraft(draft, t)
    if (hasPlanDraftErrors(validation)) return null

    return toPlanData(draft)
  }, [draft, t])

  return {
    draft,
    errors,
    preview,
    canRemoveWeek: draft.weeks.length > 1,
    update,
    setLevel,
    addWeek,
    removeWeek,
    toggleDeload,
    setDayRoutine,
    submit,
  }
}
