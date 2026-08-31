import type { TrainingPlan } from '../types/training.types'
import type { PlanDraft, PlanDraftErrors, PlanWeekDraft } from '../types/planDraft.types'

/**
 * Traducción y validación del borrador de plan. Funciones puras.
 */

/** Días de un microciclo. Siete, siempre: los de descanso también son parte. */
const DAYS_PER_WEEK = 7

/**
 * El 1 de enero de 2024 fue lunes.
 *
 * Sirve de ancla para nombrar los días sin escribir la lista a mano, igual que
 * hace el calendario: los nombres salen de `Intl` y no de siete literales que
 * habría que traducir otra vez el día que la interfaz hable otro idioma.
 */
const MONDAY_ANCHOR = Date.UTC(2024, 0, 1)
const MILLISECONDS_PER_DAY = 86_400_000

/** `1` → «lunes». */
export function weekdayName(dayOfWeek: number): string {
  const date = new Date(MONDAY_ANCHOR + (dayOfWeek - 1) * MILLISECONDS_PER_DAY)
  // En UTC de punta a punta: sumar días sobre una fecha local se tuerce al
  // cruzar un cambio de hora.
  return date.toLocaleDateString('es-ES', { weekday: 'long', timeZone: 'UTC' })
}

function createRestingWeek(): PlanWeekDraft {
  return {
    id: crypto.randomUUID(),
    isDeload: false,
    days: Array.from({ length: DAYS_PER_WEEK }, (_, index) => ({
      dayOfWeek: index + 1,
      routineId: '',
    })),
  }
}

/**
 * Una semana nueva copia los días de la anterior.
 *
 * En un mesociclo la estructura se repite semana a semana: lo que cambia es la
 * dosis, no qué se entrena cada día. Arrancar cada semana en blanco obligaría a
 * volver a elegir las mismas rutinas tres veces seguidas.
 *
 * Es también donde se ve la carencia del modelo: como la prescripción vive
 * dentro de la rutina, repetir la estructura repite además la dosis, y hoy no
 * hay forma de decir «lo mismo con más volumen». Está anotado como deuda.
 */
export function createWeekDraftFrom(previous: PlanWeekDraft | undefined): PlanWeekDraft {
  if (previous === undefined) return createRestingWeek()

  return {
    id: crypto.randomUUID(),
    isDeload: false,
    days: previous.days.map((day) => ({ ...day })),
  }
}

export function createEmptyPlanDraft(): PlanDraft {
  return {
    title: '',
    description: '',
    objectiveId: '',
    splitId: '',
    weeklyFrequency: '3',
    level: 'Principiante',
    weeks: [createRestingWeek()],
  }
}

/** Un plan existente, como borrador, para editarlo. */
export function toPlanDraft(plan: TrainingPlan): PlanDraft {
  return {
    title: plan.title,
    description: plan.description,
    objectiveId: plan.objectiveId,
    splitId: plan.splitId,
    weeklyFrequency: String(plan.weeklyFrequency),
    level: plan.level,
    weeks: plan.weeks.map((week) => ({
      id: crypto.randomUUID(),
      isDeload: week.isDeload,
      days: week.days.map((day) => ({
        dayOfWeek: day.dayOfWeek,
        routineId: day.routineId ?? '',
      })),
    })),
  }
}

function parseWholeNumber(value: string): number {
  const parsed = Number.parseInt(value.trim(), 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

/**
 * Borrador a plan, sin identificador.
 *
 * El número de cada semana sale de su POSICIÓN y no se guarda en el borrador:
 * es un dato derivado, y almacenarlo obligaría a renumerar a mano cada vez que
 * se borra una semana intermedia — que es exactamente la clase de dato que
 * acaba mintiendo.
 */
export function toPlanData(draft: PlanDraft): Omit<TrainingPlan, 'id'> {
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    objectiveId: draft.objectiveId,
    splitId: draft.splitId,
    weeklyFrequency: parseWholeNumber(draft.weeklyFrequency),
    level: draft.level,
    weeks: draft.weeks.map((week, index) => ({
      number: index + 1,
      isDeload: week.isDeload,
      days: week.days.map((day) => ({
        dayOfWeek: day.dayOfWeek,
        routineId: day.routineId === '' ? null : day.routineId,
      })),
    })),
  }
}

/** Plan de mentira para el resumen en vivo, igual que en la rutina. */
export function toPlanPreview(draft: PlanDraft): TrainingPlan {
  return { id: 'preview', ...toPlanData(draft) }
}

/**
 * Validación.
 *
 * El objetivo y la división son obligatorios porque son lo que hace que un plan
 * sea un plan y no una lista de días: determinan cómo se prescribe y cómo se
 * reparte el cuerpo entre sesiones. La descripción no lo es.
 */
export function validatePlanDraft(draft: PlanDraft): PlanDraftErrors {
  const errors: PlanDraftErrors = {}

  if (draft.title.trim() === '') {
    errors.title = 'Ponle un nombre al plan.'
  }

  if (draft.objectiveId === '') {
    errors.objectiveId = 'Elige el objetivo del mesociclo.'
  }

  if (draft.splitId === '') {
    errors.splitId = 'Elige cómo se reparte el cuerpo entre sesiones.'
  }

  if (parseWholeNumber(draft.weeklyFrequency) < 1) {
    errors.weeklyFrequency = 'La frecuencia tiene que ser al menos 1.'
  }

  if (draft.weeks.length === 0) {
    errors.weeks = 'Un plan necesita al menos una semana.'
    return errors
  }

  // Un plan sin una sola sesión asignada no es un plan: son semanas de descanso.
  const hasAnySession = draft.weeks.some((week) =>
    week.days.some((day) => day.routineId !== '')
  )

  if (!hasAnySession) {
    errors.weeks = 'Asigna al menos una rutina a algún día.'
  }

  return errors
}

export function hasPlanDraftErrors(errors: PlanDraftErrors): boolean {
  return Object.keys(errors).length > 0
}
