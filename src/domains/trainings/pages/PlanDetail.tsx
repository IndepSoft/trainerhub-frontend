import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/components/PageHeader'
import { cn } from '@/shared/lib/utils'
import { usePlan } from '../hooks/usePlans'
import { useRoutines } from '../hooks/useRoutines'
import { useTrainingDeletion } from '../hooks/useTrainingDeletion'
import { useTrainingCatalog } from '../hooks/useTrainingCatalog'
import { weekdayName } from '../libs/planDraft'
import { estimateRoutineMinutes } from '../libs/routine.utils'
import { LEVEL_BADGE } from '../libs/levelBadge'
import { PlanSummary } from '../components/PlanSummary'
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog'

/**
 * Ficha de un plan. Sólo composición.
 *
 * Existe para que la tarjeta lleve a algo que se LEE y no directamente a un
 * formulario: consultar un mesociclo —qué se hace cada día, cuánto dura, dónde
 * está la descarga— es lo que se hace a diario, y editarlo, de vez en cuando.
 * Aterrizar en el formulario obligaba a leer entre desplegables.
 */
export default function PlanDetail() {
  const navigate = useNavigate()
  const { planId } = useParams<{ planId: string }>()
  const { plan, loading } = usePlan(planId)
  const { routines } = useRoutines()
  const { objectivesById, splitsById } = useTrainingCatalog()
  const { deletePlan } = useTrainingDeletion()

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const routinesById = useMemo(
    () => new Map(routines.map((routine) => [routine.id, routine])),
    [routines]
  )

  // `plan === null` no significa «no existe» hasta que `loading` es falso.
  if (loading) return null

  if (plan === null) {
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

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      <PageHeader>
        <Link
          to="/trainings?tab=planes"
          className="-ms-2 mb-3 inline-flex h-11 items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/45 transition-colors hover:text-cobalt"
        >
          <ArrowLeft className="size-4" />
          Planes
        </Link>

        <PageHeader.Content>
          <div className="min-w-0">
            <PageHeader.Eyebrow>{plan.description}</PageHeader.Eyebrow>
            <PageHeader.Title className="text-3xl">{plan.title}</PageHeader.Title>
          </div>

          <PageHeader.Actions>
            <Button
              type="button"
              variant="outline"
              className="gap-2 text-danger"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              Eliminar
            </Button>
            <Button asChild className="gap-2">
              <Link to={`/trainings/plans/${plan.id}/edit`}>
                <Pencil className="size-4" />
                Editar
              </Link>
            </Button>
          </PageHeader.Actions>
        </PageHeader.Content>
      </PageHeader>

      <div className="flex-1 overflow-auto">
        <PlanSummary plan={plan} />

        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 px-5 py-6 sm:grid-cols-3">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">
              Objetivo
            </dt>
            <dd className="mt-1 text-sm text-ink">
              {objectivesById.get(plan.objectiveId)?.name ?? 'Sin objetivo'}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">
              División
            </dt>
            <dd className="mt-1 text-sm text-ink">
              {splitsById.get(plan.splitId)?.name ?? 'Sin división'}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">
              Nivel
            </dt>
            <dd className="mt-1">
              <span
                className={cn(
                  'inline-block rounded-action border px-2.5 py-0.5 text-sm font-semibold uppercase tracking-wider',
                  LEVEL_BADGE[plan.level]
                )}
              >
                {plan.level}
              </span>
            </dd>
          </div>
        </dl>

        <section className="px-5 pb-8">
          <h2 className="mb-1 border-b border-cobalt-tint-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
            Microciclos
          </h2>

          <ol className="divide-y divide-cobalt-tint-3">
            {plan.weeks.map((week) => (
              <li key={week.number} className="py-5">
                <div className="flex items-center gap-3">
                  <span className="metric-figures w-6 shrink-0 text-sm font-bold text-cobalt">
                    {String(week.number).padStart(2, '0')}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">
                    Semana
                  </span>
                  {week.isDeload && (
                    <span className="rounded-action border border-ember/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ember-deep">
                      Descarga
                    </span>
                  )}
                </div>

                {/*
                  Los SIETE dias, descansos incluidos: ver los huecos es parte de
                  leer un microciclo, y ocultarlos haria que «lunes, miercoles y
                  viernes» y «tres dias seguidos» se vieran igual.

                  Dos medidas tomadas en el navegador y no de oido: cada fila es
                  de 44 px porque el enlace suelto medía 20 y son once destinos
                  que se tocan con el pulgar; y en movil no se sangra porque los
                  36 px del indentado dejaban el nombre de la rutina en 99 px
                  cuando necesita 136, o sea truncando justo el dato que se viene
                  a leer. Desde `sm` sobra sitio y el sangrado vuelve, que es lo
                  que alinea los dias bajo el numero de semana.
                */}
                <ul className="mt-2 sm:ps-9">
                  {week.days.map((day) => {
                    const routine =
                      day.routineId === null ? undefined : routinesById.get(day.routineId)

                    return (
                      <li
                        key={day.dayOfWeek}
                        className="relative flex min-h-11 items-center justify-between gap-4 text-sm"
                      >
                        <span className="w-20 shrink-0 capitalize text-ink/45 sm:w-24">
                          {weekdayName(day.dayOfWeek)}
                        </span>

                        {routine === undefined ? (
                          <span className="min-w-0 flex-1 text-ink/30">Descanso</span>
                        ) : (
                          <>
                            {/* Mide 44 px por si mismo ADEMAS de estirarse: un
                                enlace estirado tiene el area de pulsacion de la
                                fila, pero su caja sigue midiendo lo que el
                                texto, y cualquier auditoria lo cuenta como un
                                destino de 20 px. */}
                            <Link
                              to={`/trainings/${routine.id}`}
                              className="flex min-h-11 min-w-0 flex-1 items-center truncate text-ink underline-offset-4 outline-none after:absolute after:inset-0 hover:text-cobalt hover:underline focus-visible:underline"
                            >
                              {routine.title}
                            </Link>
                            <span className="metric-figures shrink-0 text-ink/40">
                              {estimateRoutineMinutes(routine)} min
                            </span>
                          </>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <ConfirmDeleteDialog
        open={isDeleteOpen}
        name={plan.title}
        kind="el plan"
        onOpenChange={setIsDeleteOpen}
        onConfirm={() => {
          void deletePlan(plan.id).then(() => navigate('/trainings?tab=planes'))
        }}
      />
    </div>
  )
}
