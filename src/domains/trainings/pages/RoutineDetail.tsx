import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, Copy, Dumbbell, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/components/PageHeader'
import { cn } from '@/shared/lib/utils'
import { useRoutine } from '../hooks/useRoutines'
import { LEVEL_BADGE } from '../libs/levelBadge'
import {
  BLOCK_METHOD_LABELS,
  countExercises,
  countTotalSets,
  estimateRoutineMinutes,
  formatPrescription,
  formatRest,
} from '../libs/routine.utils'
import { useTrainingCatalog } from '../hooks/useTrainingCatalog'
import { useTrainingDeletion } from '../hooks/useTrainingDeletion'
import { ConfirmDeleteDialog } from '@/shared/components/ConfirmDeleteDialog'

/**
 * Ficha de una rutina. Sólo composición.
 */
export default function RoutineDetail() {
  const navigate = useNavigate()
  const { routineId } = useParams<{ routineId: string }>()
  const { routine, loading } = useRoutine(routineId)
  const { exercisesById } = useTrainingCatalog()
  const { routineDeletionBlocker, deleteRoutine } = useTrainingDeletion()

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  /*
   * El motivo del bloqueo se calcula al ABRIR el dialogo y no al confirmar: asi
   * el dialogo puede explicar por que no se va a poder en vez de preguntar algo
   * que ya se sabe que no tiene respuesta.
   */
  const [blockedReason, setBlockedReason] = useState<string | undefined>(undefined)

  // Mientras carga no se pinta nada: `routine === null` no significa «no
  // existe» hasta que `loading` es falso.
  if (loading) return null

  if (!routine) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-bone px-6 text-center">
        <p className="font-display text-2xl font-extrabold uppercase text-ink">
          Rutina no encontrada
        </p>
        <p className="text-sm text-ink/50">
          El enlace puede haber caducado o la rutina ya no existe.
        </p>
        <Button asChild variant="outline">
          <Link to="/trainings">Volver a rutinas</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      <PageHeader>
        <Link
          to="/trainings"
          className="-ms-2 mb-3 inline-flex h-11 items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/45 transition-colors hover:text-cobalt"
        >
          <ArrowLeft className="size-4" />
          Rutinas
        </Link>

        <PageHeader.Content>
          <div className="min-w-0">
            <PageHeader.Eyebrow>{routine.description}</PageHeader.Eyebrow>
            <PageHeader.Title className="text-3xl">{routine.title}</PageHeader.Title>
          </div>

          <PageHeader.Actions>
            {/* «Usar en una sesion» navega a la agenda con la rutina en la
                URL: esta ficha no puede abrir el dialogo de la agenda, que vive
                en otro dominio, pero si decirle con que llegar. */}
            <Button
              type="button"
              variant="outline"
              className="gap-2 text-danger"
              onClick={() => {
                setBlockedReason(routineDeletionBlocker(routine.id))
                setIsDeleteOpen(true)
              }}
            >
              <Trash2 className="size-4" />
              Eliminar
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link to={`/trainings/${routine.id}/edit`}>
                <Pencil className="size-4" />
                Editar
              </Link>
            </Button>
            <Button asChild className="gap-2">
              <Link to={`/calendar?routine=${routine.id}`}>
                <Copy className="size-4" />
                Usar en una sesión
              </Link>
            </Button>
          </PageHeader.Actions>
        </PageHeader.Content>
      </PageHeader>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex flex-col gap-2 px-5 py-6">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">
              Ejercicios
            </span>
            <p className="metric-figures font-display text-4xl font-extrabold leading-none text-ink">
              {countExercises(routine)}
            </p>
          </div>

          <div className="flex flex-col gap-2 px-5 py-6">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">
              Duración
            </span>
            <p className="metric-figures font-display text-4xl font-extrabold leading-none text-ink">
              {estimateRoutineMinutes(routine)}
              <span className="ml-1 text-xl font-bold text-ink/45">min</span>
            </p>
          </div>

          <div className="flex flex-col gap-2 px-5 py-6">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">
              Nivel
            </span>
            <span
              className={cn(
                'w-fit rounded-action border px-2.5 py-0.5 text-sm font-semibold uppercase tracking-wider',
                LEVEL_BADGE[routine.level]
              )}
            >
              {routine.level}
            </span>
          </div>
        </div>

        <section className="px-5 py-8">
          <h2 className="mb-1 flex items-center justify-between border-b border-cobalt-tint-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
            Bloques
            <Dumbbell className="size-4 text-cobalt" />
          </h2>

          {/*
            Se listan BLOQUES y no ejercicios sueltos. El bloque es lo que se
            ejecuta como unidad: una superserie encadena sus ejercicios sin
            descanso, y aplanarla en una lista numerada dice que van uno detras
            de otro con su pausa, que es lo contrario.
          */}
          <ol className="divide-y divide-cobalt-tint-3">
            {routine.blocks.map((block, index) => (
              <li key={block.id} className="py-5">
                <div className="flex items-baseline gap-3">
                  <span className="metric-figures w-6 shrink-0 text-sm font-bold text-cobalt">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <span
                    className={cn(
                      'rounded-action border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]',
                      block.method === 'simple'
                        ? 'border-cobalt-tint-3 text-ink/45'
                        : 'border-ember/40 text-ember-deep'
                    )}
                  >
                    {BLOCK_METHOD_LABELS[block.method]}
                  </span>

                  <span className="metric-figures ms-auto shrink-0 text-xs text-ink/40">
                    descanso {formatRest(block.restAfterSeconds)}
                  </span>
                </div>

                <ul className="mt-3 space-y-2 ps-9">
                  {block.exercises.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-baseline justify-between gap-4 text-sm"
                    >
                      <span className="min-w-0 flex-1 truncate text-ink">
                        {exercisesById.get(item.exerciseId)?.name ?? 'Ejercicio'}
                      </span>
                      <span className="metric-figures shrink-0 font-semibold text-ink/55">
                        {formatPrescription(item)}
                      </span>
                    </li>
                  ))}
                </ul>

                {block.notes && (
                  <p className="mt-2 ps-9 text-xs text-ink/40">{block.notes}</p>
                )}
              </li>
            ))}
          </ol>

          {/* Volumen y duracion, ambos derivados. Las series totales son la
              medida que se programa: «cuantas series de pecho llevo esta
              semana» es la pregunta real, no cuantos ejercicios hay. */}
          <p className="metric-figures mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/40">
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {estimateRoutineMinutes(routine)} min estimados
            </span>
            <span>{countTotalSets(routine)} series en total</span>
          </p>
        </section>
      </div>

      <ConfirmDeleteDialog
        open={isDeleteOpen}
        name={routine.title}
        kind="la rutina"
        blockedReason={blockedReason}
        onOpenChange={setIsDeleteOpen}
        onConfirm={() => {
          void deleteRoutine(routine.id).then((result) => {
            if (result.deleted) navigate('/trainings')
            else setBlockedReason(result.reason)
          })
        }}
      />
    </div>
  )
}
