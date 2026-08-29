import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/shared/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import {
  ChevronRight,
  Clock,
  Copy,
  Dumbbell,
  MoreVertical,
  Play,
} from 'lucide-react'
import { useLongPress } from '@/shared/hooks/useLongPress'
import { cn } from '@/shared/lib/utils'
import { LEVEL_BADGE } from '../libs/levelBadge'
import type { Routine } from '../types/training.types'

interface RoutineCardProps {
  routine: Routine
}

/** Cuántos ejercicios se listan antes de resumir el resto. */
const VISIBLE_EXERCISES = 3

/**
 * Tarjeta de rutina. La tarjeta ENTERA es el destino.
 *
 * Mismo patrón que la de estudiante: el enlace envuelve el título y se estira
 * con un pseudoelemento, y el menú de acciones queda por encima con `z-10`. Un
 * `<button>` dentro de un `<a>` es HTML inválido y en móvil el navegador
 * resuelve el conflicto de forma impredecible.
 */
export function RoutineCard({ routine }: RoutineCardProps) {
  const navigate = useNavigate()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { handlers: longPressHandlers } = useLongPress({
    onLongPress: () => setIsMenuOpen(true),
  })

  const visible = routine.exercises.slice(0, VISIBLE_EXERCISES)
  const remaining = routine.exercises.length - visible.length

  return (
    <Card
      className="group relative border-cobalt-tint-3 shadow-none transition-colors hover:border-cobalt/40 focus-within:border-cobalt"
      {...longPressHandlers}
    >
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-xl font-bold uppercase leading-tight tracking-tight text-ink">
              <Link
                to={`/trainings/${routine.id}`}
                className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:underline"
              >
                {routine.title}
              </Link>
            </h3>
            <p className="mt-1 text-sm text-ink/50">{routine.description}</p>
          </div>

          {/* `relative z-10` para quedar por encima del enlace estirado.
              TODO: ninguna de las cinco acciones esta conectada. */}
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Acciones para ${routine.title}`}
                className="relative z-10 -me-2 -mt-1 inline-flex size-11 shrink-0 items-center justify-center rounded-action text-ink/35 transition-colors hover:text-ink"
              >
                <MoreVertical className="size-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => navigate(`/trainings/${routine.id}`)}>
                <Dumbbell className="me-2 size-4" />
                Ver rutina
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="me-2 size-4" />
                Usar en una sesión
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Play className="me-2 size-4" />
                Vista previa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Editar</DropdownMenuItem>
              <DropdownMenuItem className="text-danger">Eliminar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span
            className={cn(
              'rounded-action border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
              LEVEL_BADGE[routine.level]
            )}
          >
            {routine.level}
          </span>

          <span className="metric-figures flex items-center gap-1.5 text-sm text-ink/60">
            <Dumbbell className="size-4 text-cobalt" />
            {routine.exercises.length} ejercicios
          </span>

          <span className="metric-figures flex items-center gap-1.5 text-sm text-ink/60">
            <Clock className="size-4 text-cobalt" />
            {routine.durationMinutes} min
          </span>
        </div>

        {/* Solo los primeros ejercicios. La tarjeta es un avance, no la ficha:
            listarlos todos hacia que dos rutinas largas ocuparan la pantalla
            entera y dejaran de compararse. */}
        <ul className="space-y-1.5 border-t border-cobalt-tint-3 pt-3">
          {visible.map((exercise) => (
            <li
              key={exercise.id}
              className="flex items-baseline justify-between gap-4 text-sm"
            >
              <span className="min-w-0 truncate text-ink/75">{exercise.name}</span>
              <span className="metric-figures shrink-0 text-ink/45">
                {exercise.prescription}
              </span>
            </li>
          ))}

          {remaining > 0 && (
            <li className="metric-figures pt-1 text-xs text-ink/35">
              +{remaining} {remaining === 1 ? 'ejercicio más' : 'ejercicios más'}
            </li>
          )}
        </ul>

        <ChevronRight
          aria-hidden="true"
          className="absolute bottom-4 right-4 size-4 text-ink/20 transition-colors group-hover:text-cobalt"
        />
      </CardContent>
    </Card>
  )
}
