import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, Copy, Dumbbell, Play } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/components/PageHeader'
import { cn } from '@/shared/lib/utils'
import { useRoutine } from '../hooks/useRoutine'
import { LEVEL_BADGE } from '../libs/levelBadge'

/**
 * Ficha de una rutina. Sólo composición.
 */
export default function RoutineDetail() {
  const { routineId } = useParams<{ routineId: string }>()
  const { routine } = useRoutine(routineId)

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
            {/* TODO: ninguna de las dos acciones esta conectada. */}
            <Button variant="outline" className="gap-2">
              <Play className="size-4" />
              Vista previa
            </Button>
            <Button className="gap-2">
              <Copy className="size-4" />
              Usar en una sesión
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
              {routine.exercises.length}
            </p>
          </div>

          <div className="flex flex-col gap-2 px-5 py-6">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">
              Duración
            </span>
            <p className="metric-figures font-display text-4xl font-extrabold leading-none text-ink">
              {routine.durationMinutes}
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
            Ejercicios
            <Dumbbell className="size-4 text-cobalt" />
          </h2>

          {/* Lista numerada: en una rutina el ORDEN es parte de la
              prescripcion, y una lista sin numerar no lo comunica. Las cifras
              van tabulares para que las prescripciones caigan en columna. */}
          <ol className="divide-y divide-cobalt-tint-3">
            {routine.exercises.map((exercise, index) => (
              <li
                key={exercise.id}
                className="flex items-baseline gap-4 py-4"
              >
                <span className="metric-figures w-6 shrink-0 text-sm font-bold text-cobalt">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1 text-ink">{exercise.name}</span>
                <span className="metric-figures shrink-0 text-sm font-semibold text-ink/50">
                  {exercise.prescription}
                </span>
              </li>
            ))}
          </ol>

          <p className="metric-figures mt-4 flex items-center gap-1.5 text-xs text-ink/40">
            <Clock className="size-3.5" />
            {routine.durationMinutes} min estimados
          </p>
        </section>
      </div>
    </div>
  )
}
