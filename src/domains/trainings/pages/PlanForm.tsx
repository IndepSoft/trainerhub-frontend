import { useMemo, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, CalendarPlus } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/components/PageHeader'
import { usePlan } from '../hooks/usePlans'
import { usePlanDraft } from '../hooks/usePlanDraft'
import { useRoutines } from '../hooks/useRoutines'
import { usePlanActions } from '../hooks/usePlanActions'
import { PlanIdentityFields } from '../components/PlanIdentityFields'
import { PlanWeekEditor } from '../components/PlanWeekEditor'
import { PlanSummary } from '../components/PlanSummary'
import type { TrainingPlan } from '@/shared/domain/entities/plan'

/**
 * Crear y editar un plan. Sólo composición.
 *
 * Una sola página para las dos cosas, igual que `RoutineForm`: la ruta decide.
 * `/trainings/plans/new` no trae `planId` y `/trainings/plans/:planId/edit` sí.
 *
 * Al guardar se vuelve a donde se estaba: a la ficha del plan si se editaba, y
 * a la lista de planes si se acaba de crear —ahí no hay ficha a la que ir hasta
 * que el plan existe—.
 */
export default function PlanForm() {
  const { planId } = useParams<{ planId: string }>()
  const { plan, loading } = usePlan(planId)

  const isEditing = planId !== undefined

  // Mientras carga no se pinta nada: `plan === null` no significa «no existe»
  // hasta que `loading` es falso.
  if (isEditing && loading) return null

  if (isEditing && plan === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-bone px-6 text-center">
        <p className="font-display text-2xl font-extrabold uppercase text-ink">
          Plan no encontrado
        </p>
        <p className="text-sm text-ink/50">
          El enlace puede haber caducado o el plan ya no existe.
        </p>
        <Button asChild variant="outline">
          <Link to="/trainings?tab=planes">Volver a planes</Link>
        </Button>
      </div>
    )
  }

  /*
   * `key` para que el borrador se inicialice CON el plan ya cargado. Mismo
   * motivo que en `RoutineForm`: `usePlanDraft` toma su estado inicial una sola
   * vez, y el plan llega despues del primer render porque el puerto es
   * asincrono.
   */
  return <PlanFormFields key={plan?.id ?? 'nuevo'} plan={plan} />
}

interface PlanFormFieldsProps {
  /** El plan que se edita, o `null` para dar uno de alta. */
  plan: TrainingPlan | null
}

function PlanFormFields({ plan }: PlanFormFieldsProps) {
  const navigate = useNavigate()
  const { routines } = useRoutines()
  const { createPlan, updatePlan } = usePlanActions()

  const planId = plan?.id
  const isEditing = plan !== null

  const {
    draft,
    errors,
    preview,
    canRemoveWeek,
    update,
    setLevel,
    addWeek,
    removeWeek,
    toggleDeload,
    setDayRoutine,
    submit,
  } = usePlanDraft(plan)

  // Alfabético, para que elegir la rutina de un día no sea buscar en el orden
  // en que se crearon.
  const sortedRoutines = useMemo(
    () => [...routines].sort((left, right) => left.title.localeCompare(right.title, 'es')),
    [routines]
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const data = submit()
    if (data === null) return

    if (planId === undefined) {
      const created = await createPlan(data)
      navigate(`/trainings/plans/${created.id}`)
      return
    }

    await updatePlan(planId, data)
    navigate(`/trainings/plans/${planId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden bg-bone">
      <PageHeader>
        <Link
          to={isEditing ? `/trainings/plans/${planId}` : '/trainings?tab=planes'}
          className="-ms-2 mb-3 inline-flex h-11 items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/45 transition-colors hover:text-cobalt"
        >
          <ArrowLeft className="size-4" />
          {isEditing ? 'Volver a la ficha' : 'Planes'}
        </Link>

        <PageHeader.Content>
          <div className="min-w-0">
            <PageHeader.Eyebrow>Lo que asignas</PageHeader.Eyebrow>
            <PageHeader.Title>{isEditing ? 'Editar plan' : 'Nuevo plan'}</PageHeader.Title>
          </div>

          <PageHeader.Actions>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate(isEditing ? `/trainings/plans/${planId}` : '/trainings?tab=planes')
              }
            >
              Cancelar
            </Button>
            <Button type="submit">{isEditing ? 'Guardar cambios' : 'Guardar plan'}</Button>
          </PageHeader.Actions>
        </PageHeader.Content>
      </PageHeader>

      <div className="flex-1 overflow-auto">
        <PlanSummary plan={preview} />

        <div className="space-y-6 px-5 py-6">
          {errors.weeks !== undefined && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-block border border-danger/40 bg-danger-surface px-4 py-3 text-sm text-danger"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {errors.weeks}
            </p>
          )}

          <PlanIdentityFields
            draft={draft}
            errors={errors}
            onChange={update}
            onLevelChange={setLevel}
          />

          <div>
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
              Microciclos
            </h2>

            {routines.length === 0 ? (
              <p className="rounded-block border border-cobalt-tint-3 bg-white px-4 py-6 text-center text-sm text-ink/45">
                Todavía no hay rutinas que asignar. Crea una primero y vuelve.
              </p>
            ) : (
              <ul className="space-y-4">
                {draft.weeks.map((week, index) => (
                  <li key={week.id}>
                    <PlanWeekEditor
                      week={week}
                      position={index + 1}
                      routines={sortedRoutines}
                      canRemove={canRemoveWeek}
                      onRemove={() => removeWeek(week.id)}
                      onToggleDeload={() => toggleDeload(week.id)}
                      onChangeDay={(dayOfWeek, routineId) =>
                        setDayRoutine(week.id, dayOfWeek, routineId)
                      }
                    />
                  </li>
                ))}
              </ul>
            )}

            {/* Añadir una semana copia la anterior: en un mesociclo la
                estructura se repite. Ver `libs/planDraft.ts`. */}
            <Button type="button" variant="outline" className="mt-4 w-full gap-2" onClick={addWeek}>
              <CalendarPlus className="size-4" />
              Añadir semana
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
