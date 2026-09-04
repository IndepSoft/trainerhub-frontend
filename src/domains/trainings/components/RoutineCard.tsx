import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { ArrowUpRight, Copy, Dumbbell, MoreVertical, Play } from 'lucide-react'
import { useLongPress } from '@/shared/hooks/useLongPress'
import { cn } from '@/shared/lib/utils'
import { LEVEL_BADGE } from '../libs/levelBadge'
import {
  countExercises,
  estimateRoutineMinutes,
  flattenPrescribedExercises,
  formatPrescription,
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

/** Cuántos ejercicios se listan antes de resumir el resto. */
const VISIBLE_EXERCISES = 3

/**
 * Tarjeta de rutina, en registro editorial.
 *
 * Mismo lenguaje que la de estudiante: rasgos editoriales -Condensed grande,
 * corte diagonal, rejilla de metricas, flecha de destino- en tono claro y con
 * el borde del sistema. La cuna va a la altura del titulo porque es donde el
 * corte parte algo.
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
  const visible = prescribed.slice(0, VISIBLE_EXERCISES)
  const remaining = prescribed.length - visible.length

  /*
   * Los metodos distintos de `simple` se muestran porque una superserie cambia
   * COMO se ejecuta la sesion, no solo su contenido, y es informacion que el
   * entrenador busca al elegir una rutina.
   */
  const methods = [
    ...new Set(
      routine.blocks
        .filter((block) => block.method !== 'simple')
        .map((block) => t(BLOCK_METHOD_LABEL_KEY[block.method]))
    ),
  ]

  return (
    <article
      className="group relative isolate flex flex-col overflow-hidden rounded-block border border-cobalt-tint-3 bg-surface transition-colors hover:border-cobalt/40 focus-within:border-cobalt"
      {...longPressHandlers}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-[-15%] top-[13%] -z-10 h-[5.5rem] bg-ember/10 transition-transform duration-300 group-hover:-translate-y-0.5"
        style={{ clipPath: 'polygon(0 40%, 100% 0, 100% 60%, 0 100%)' }}
      />

      <div className="flex items-start justify-between gap-3 p-5 pb-0">
        {/*
          El rotulo distinguia rutina de plantilla. La marca `isTemplate` ya no
          existe -no gobernaba nada y, sin asignacion a estudiantes, todas las
          rutinas eran igualmente plantillas-, asi que queda como etiqueta de
          tipo, que sigue orientando junto a la de plan.
        */}
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-ink/45">
          <Dumbbell className="size-3.5" />
          {t('routine.title')}
        </span>

        {/* `relative z-10` para quedar por encima del enlace estirado.
            TODO: «Vista previa» sigue sin conectar. */}
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Acciones para ${routine.title}`}
              className="relative z-10 -me-2 -mt-2 inline-flex size-11 shrink-0 items-center justify-center rounded-action text-ink/35 transition-colors hover:text-ink"
            >
              <MoreVertical className="size-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => navigate(`/trainings/${routine.id}`)}>
              <Dumbbell className="me-2 size-4" />
              {t('routine.view')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => navigate(`/calendar?routine=${routine.id}`)}
            >
              <Copy className="me-2 size-4" />
              {t('routine.useInSession')}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Play className="me-2 size-4" />
              {t('routine.preview')}
            </DropdownMenuItem>
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

      <h3 className="mt-2 px-5 font-display text-[1.75rem] font-extrabold uppercase leading-[0.94] tracking-tight text-ink">
        <Link
          to={`/trainings/${routine.id}`}
          className="outline-none after:absolute after:inset-0 focus-visible:underline"
        >
          {routine.title}
        </Link>
      </h3>

      <dl className="mt-5 grid grid-cols-2 divide-x divide-cobalt-tint-3 border-y border-cobalt-tint-3">
        <div className="px-5 py-3">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">
            {t('routine.exercises')}
          </dt>
          <dd className="metric-figures font-display text-xl font-bold text-ink">
            {countExercises(routine)}
          </dd>
        </div>
        <div className="px-5 py-3">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">
            {t('routine.duration')}
          </dt>
          <dd className="metric-figures font-display text-xl font-bold text-ink">
            {estimateRoutineMinutes(routine)}
            <span className="ml-1 text-xs font-semibold text-ink/40">{t('routine.minutes')}</span>
          </dd>
        </div>
      </dl>

      {/* Solo los primeros. La tarjeta es un avance, no la ficha: listarlos
          todos hacia que dos rutinas largas ocuparan la pantalla entera. */}
      <ul className="space-y-2 px-5 py-4">
        {visible.map((item) => (
          <li key={item.id} className="flex items-baseline justify-between gap-4 text-sm">
            <span className="min-w-0 truncate text-ink/70">
              {exercisesById.get(item.exerciseId)?.name ?? t('exercise.fallback')}
            </span>
            <span className="metric-figures shrink-0 text-ink/40">
              {formatPrescription(item)}
            </span>
          </li>
        ))}

        {remaining > 0 && (
          <li className="metric-figures text-xs text-ink/35">
            {plural('routine.moreOne', 'routine.moreOther', remaining, { count: remaining })}
          </li>
        )}
      </ul>

      <div className="mt-auto flex items-center gap-2 px-5 pb-5">
        <span
          className={cn(
            'rounded-action border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]',
            LEVEL_BADGE[routine.level]
          )}
        >
          {t(STUDENT_LEVEL_LABEL_KEY[routine.level])}
        </span>

        {methods.map((method) => (
          <span
            key={method}
            className="rounded-action border border-ember/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ember-deep"
          >
            {method}
          </span>
        ))}

        <ArrowUpRight
          aria-hidden="true"
          className="ms-auto size-5 text-ink/25 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ember"
        />
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
