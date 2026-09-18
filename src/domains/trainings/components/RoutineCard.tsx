import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Copy, Dumbbell, MoreVertical } from 'lucide-react'
import { useLongPress } from '@/shared/hooks/useLongPress'
import { cn } from '@/shared/lib/utils'
import { LEVEL_BADGE } from '../libs/levelBadge'
import {
  countExercises,
  countTotalSets,
  estimateRoutineMinutes,
  flattenPrescribedExercises,
} from '../libs/routine.utils'
import { useTrainingCatalog } from '../hooks/useTrainingCatalog'
import { useTrainingDeletion } from '../hooks/useTrainingDeletion'
import { ConfirmDeleteDialog } from '@/shared/components/ConfirmDeleteDialog'
import type { Routine } from '../types/training.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import {
  BLOCK_METHOD_LABEL_KEY,
  STUDENT_LEVEL_LABEL_KEY,
} from '@/shared/i18n/domainLabels'

interface RoutineCardProps {
  routine: Routine
}

/**
 * Tarjeta de rutina: el título, lo que mide y qué lleva dentro.
 *
 * COMPACTA, y antes no. Tenía cuña diagonal, rejilla de dos cifras y los tres
 * primeros ejercicios con su prescripción, uno por fila: 320 px por rutina, una
 * y media por pantalla de teléfono. La prescripción —series, repeticiones,
 * RIR— es de la ficha; aquí sólo hace falta lo que distingue una rutina de
 * otra, que son los ejercicios que lleva, y caben en una línea.
 *
 * El enlace estirado envuelve el título y el menú queda por encima con `z-10`.
 */
export function RoutineCard({ routine }: RoutineCardProps) {
  const { t, plural } = useTranslation()
  const navigate = useNavigate()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { handlers: longPressHandlers } = useLongPress({
    onLongPress: () => setIsMenuOpen(true),
  })

  const { exercisesById } = useTrainingCatalog()
  const { routineDeletionBlocker, deleteRoutine } = useTrainingDeletion()

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [blockedReason, setBlockedReason] = useState<string | undefined>(undefined)

  const prescribed = flattenPrescribedExercises(routine)
  const exerciseCount = countExercises(routine)
  const sets = countTotalSets(routine)

  /*
   * Los ejercicios EN UNA LÍNEA, separados por puntos, y truncada: es lo que
   * distingue una rutina de otra de un vistazo. Listarlos en filas convertía la
   * tarjeta en un índice de la ficha.
   */
  const exerciseNames = prescribed
    .map((item) => exercisesById.get(item.exerciseId)?.name ?? t('exercise.fallback'))
    .join(' · ')

  const methods = [
    ...new Set(
      routine.blocks
        .filter((block) => block.method !== 'simple')
        .map((block) => t(BLOCK_METHOD_LABEL_KEY[block.method]))
    ),
  ]

  return (
    <article
      className="group relative flex flex-col gap-2 rounded-block border border-cobalt-tint-3 bg-surface p-4 transition-colors hover:border-cobalt/40 focus-within:border-cobalt"
      {...longPressHandlers}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Sin rótulo «RUTINA» encima: la pestaña en la que está ya lo dice, y
            se llevaba una línea entera de cada tarjeta. */}
        <h3 className="min-w-0 font-display text-[1.375rem] font-extrabold uppercase leading-none tracking-tight text-ink">
          <Link
            to={`/trainings/${routine.id}`}
            className="flex min-h-11 items-center outline-none after:absolute after:inset-0 focus-visible:underline"
          >
            {routine.title}
          </Link>
        </h3>

        {/* `relative z-10` para quedar por encima del enlace estirado. */}
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Acciones para ${routine.title}`}
              className="relative z-10 -me-2 -mt-2 inline-flex size-11 shrink-0 items-center justify-center rounded-action text-ink/50 transition-colors hover:text-ink"
            >
              <MoreVertical className="size-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => navigate(`/trainings/${routine.id}`)}>
              <Dumbbell className="me-2 size-4" />
              {t('routine.view')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate(`/calendar?routine=${routine.id}`)}>
              <Copy className="me-2 size-4" />
              {t('routine.useInSession')}
            </DropdownMenuItem>
            {/*
              «Vista previa» se quita en vez de conectarse: la ficha de la
              rutina -«Ver»- ya enseña sus bloques y ejercicios enteros, que es
              todo lo que una vista previa podria enseñar. Era una entrada que
              no hacia nada, y dos entradas para el mismo destino confunden mas
              que ayudan.
            */}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate(`/trainings/${routine.id}/edit`)}>
              {t('common.edit')}
            </DropdownMenuItem>
            {/*
              `preventDefault` para que el menu no se cierre antes de abrir el
              dialogo: al cerrarse, Radix devuelve el foco al disparador y el
              dialogo naciente se lo encuentra ya movido.
            */}
            <DropdownMenuItem
              className="text-danger"
              onSelect={(event) => {
                event.preventDefault()
                setBlockedReason(routineDeletionBlocker(routine.id))
                setIsMenuOpen(false)
                setIsDeleteOpen(true)
              }}
            >
              {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="text-[13px] text-ink/60">
        {plural('routine.exerciseCount.one', 'routine.exerciseCount.other', exerciseCount, {
          count: exerciseCount,
        })}
        {' · '}
        {plural('routine.figures.one', 'routine.figures.other', sets, {
          minutes: estimateRoutineMinutes(routine),
          sets,
        })}
      </p>

      <p className="truncate text-[13px] text-ink/85">{exerciseNames}</p>

      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span
          className={cn(
            'rounded-action border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]',
            LEVEL_BADGE[routine.level]
          )}
        >
          {t(STUDENT_LEVEL_LABEL_KEY[routine.level])}
        </span>

        {/*
         * Los metodos distintos de `simple` se muestran porque una superserie
         * cambia COMO se ejecuta la sesion, no solo su contenido, y es
         * informacion que el entrenador busca al elegir una rutina.
         */}
        {methods.map((method) => (
          <span
            key={method}
            className="rounded-action border border-ember/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ember-deep"
          >
            {method}
          </span>
        ))}
      </div>

      <ConfirmDeleteDialog
        open={isDeleteOpen}
        name={routine.title}
        kind="la rutina"
        blockedReason={blockedReason}
        onOpenChange={setIsDeleteOpen}
        onConfirm={() => {
          void deleteRoutine(routine.id).then((result) => {
            if (result.deleted) setIsDeleteOpen(false)
            else setBlockedReason(result.reason)
          })
        }}
      />
    </article>
  )
}
