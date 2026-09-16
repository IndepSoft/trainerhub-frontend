import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/components/PageHeader'
import { CollapsibleRow } from '@/shared/components/CollapsibleRow'
import { usePlan } from '../hooks/usePlans'
import { useRoutines } from '../hooks/useRoutines'
import { useTrainingDeletion } from '../hooks/useTrainingDeletion'
import { useTrainingCatalog } from '../hooks/useTrainingCatalog'
import { formatWeekdayList, weekdayName } from '../libs/planDraft'
import { summarizeWeek } from '../libs/plan.utils'
import { estimateRoutineMinutes } from '../libs/routine.utils'
import { PlanSummary } from '../components/PlanSummary'
import { ConfirmDeleteDialog } from '@/shared/components/ConfirmDeleteDialog'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { useViewerContext } from '@/app/ViewerContext'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'
import { catalogLabel } from '@/shared/i18n/domainLabels'
import { PAGE_SCROLL } from '@/shared/lib/pageScroll'
import type { PlanWeek, Routine } from '../types/training.types'

interface PlanWeekRowProps {
  week: PlanWeek
  routinesById: Map<string, Routine>
  defaultOpen: boolean
}

/**
 * Una semana del mesociclo, plegada con su resumen.
 *
 * Las cuatro semanas eran 28 filas de días seguidas, descansos incluidos:
 * 1.700 px para decir «lunes, miércoles y viernes». La fila cerrada dice
 * cuántas sesiones y QUÉ DÍAS —que es lo que distingue «lunes, miércoles y
 * viernes» de «tres días seguidos», el motivo por el que antes se listaban los
 * siete—, y abierta enseña sólo los días con rutina. Los descansos se cuentan.
 */
function PlanWeekRow({ week, routinesById, defaultOpen }: PlanWeekRowProps) {
  const { t, plural } = useTranslation()
  const { trainingDays, restDays } = summarizeWeek(week)
  const sessions = plural('plan.sessionCount.one', 'plan.sessionCount.other', trainingDays.length, {
    count: trainingDays.length,
  })

  return (
    <CollapsibleRow
      title={t('plan.weekLabel', { number: String(week.number).padStart(2, '0') })}
      meta={
        trainingDays.length === 0
          ? t('plan.noSessionsWeek')
          : `${sessions} · ${formatWeekdayList(trainingDays)}`
      }
      trailing={
        week.isDeload ? (
          <span className="shrink-0 rounded-action border border-ember/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ember-deep">
            {t('plan.deload')}
          </span>
        ) : undefined
      }
      defaultOpen={defaultOpen}
    >
      <ul>
        {week.days
          .filter((day) => day.routineId !== null)
          // En el orden de la semana, el mismo que dice el resumen: el dato no
          // garantiza que lleguen ordenados.
          .sort((first, second) => first.dayOfWeek - second.dayOfWeek)
          .map((day) => {
            const routine = day.routineId === null ? undefined : routinesById.get(day.routineId)
            return (
              <li
                key={day.dayOfWeek}
                className="relative flex min-h-11 items-center justify-between gap-4 text-sm"
              >
                <span className="w-24 shrink-0 capitalize text-ink/60">
                  {weekdayName(day.dayOfWeek)}
                </span>
                {routine === undefined ? (
                  // La rutina se borró o no se ha cargado: se dice, sin enlace
                  // a una ficha que no existe.
                  <span className="min-w-0 flex-1 text-ink/40">{t('exercise.fallback')}</span>
                ) : (
                  <>
                    {/* Mide 44 px por sí mismo ADEMÁS de estirarse: la caja de
                        un enlace estirado sigue midiendo lo que el texto, y
                        la auditoría de 375 px lo cuenta como un destino de
                        20 px. */}
                    <Link
                      to={`/trainings/${routine.id}`}
                      className="flex min-h-11 min-w-0 flex-1 items-center text-ink underline-offset-4 outline-none after:absolute after:inset-0 hover:text-cobalt hover:underline focus-visible:underline"
                    >
                      {routine.title}
                    </Link>
                    <span className="metric-figures shrink-0 text-xs text-ink/45">
                      {estimateRoutineMinutes(routine)} {t('routine.minutes')}
                    </span>
                  </>
                )}
              </li>
            )
          })}

        {restDays > 0 && (
          <li className="flex min-h-11 items-center justify-between gap-4 text-sm">
            <span className="w-24 shrink-0 text-ink/60">{t('plan.restOfWeek')}</span>
            <span className="min-w-0 flex-1 text-ink/40">{t('plan.rest')}</span>
            <span className="metric-figures shrink-0 text-xs text-ink/45">
              {plural('plan.restDays.one', 'plan.restDays.other', restDays, { count: restDays })}
            </span>
          </li>
        )}
      </ul>
    </CollapsibleRow>
  )
}

/**
 * Ficha de un plan. Sólo composición.
 *
 * Existe para que la tarjeta lleve a algo que se LEE y no directamente a un
 * formulario: consultar un mesociclo —qué se hace cada día, cuánto dura, dónde
 * está la descarga— es lo que se hace a diario, y editarlo, de vez en cuando.
 * Aterrizar en el formulario obligaba a leer entre desplegables.
 */
export default function PlanDetail() {
  const { t, plural } = useTranslation()

  /* La entrada de catalogo, traducida, o el aviso de que no hay ninguna. */
  const catalogEntry = (
    entry: { id: string; name: string } | undefined,
    emptyKey: TranslationKey
  ) => (entry === undefined ? t(emptyKey) : catalogLabel(entry.id, entry.name, t))
  const navigate = useNavigate()
  const { can } = useViewerContext()
  // La ficha la lee cualquier miembro; lo que la cambia, quien gestiona.
  const manages = can('training.manage')
  const { planId } = useParams<{ planId: string }>()
  const { plan, loading } = usePlan(planId)
  const { routines } = useRoutines()
  const { objectivesById, splitsById } = useTrainingCatalog()
  const { deletePlan } = useTrainingDeletion()

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [blockedReason, setBlockedReason] = useState<string | undefined>(undefined)

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
          {t('plan.notFound')}
        </p>
        <p className="text-sm text-ink/50">{t('plan.notFoundHint')}</p>
        <Button asChild variant="outline">
          <Link to="/trainings?tab=planes">{t('plan.back')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      <PageHeader>
        <Link
          to={manages ? '/trainings?tab=planes' : '/progress'}
          className="-ms-2 mb-3 inline-flex h-11 items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/45 transition-colors hover:text-cobalt"
        >
          <ArrowLeft className="size-4" />
          {manages ? t('plan.plural') : t('nav.progress')}
        </Link>

        <PageHeader.Content>
          <PageHeader.Eyebrow>{t('plan.title')}</PageHeader.Eyebrow>
          <PageHeader.Title className="text-3xl">{plan.title}</PageHeader.Title>

          {manages && (
            <PageHeader.Actions>
              <PageHeader.SecondaryAction
                icon={Trash2}
                label={t('common.delete')}
                tone="danger"
                onClick={() => setIsDeleteOpen(true)}
              />
              <PageHeader.PrimaryAction
                icon={Pencil}
                label={t('common.edit')}
                to={`/trainings/plans/${plan.id}/edit`}
              />
            </PageHeader.Actions>
          )}
        </PageHeader.Content>

        {/* Igual que en la ficha de la rutina: la descripcion va debajo, a
            todo el ancho y solo si la hay. */}
        {plan.description !== '' && (
          <PageHeader.Description>{plan.description}</PageHeader.Description>
        )}
      </PageHeader>

      <div className={PAGE_SCROLL}>
        <PlanSummary plan={plan} />

        <div className="flex flex-col gap-6 px-5 pb-8 pt-4">
          {/* Objetivo y división, como pares y no como tres cifras gigantes:
              son rótulos, no medidas. El nivel ya va en la franja. */}
          <dl>
            <div className="flex min-h-10 items-center justify-between gap-3 border-b border-cobalt-tint-3 text-sm">
              <dt className="text-ink/60">{t('plan.objective')}</dt>
              <dd className="text-end font-semibold text-ink">
                {catalogEntry(objectivesById.get(plan.objectiveId), 'plan.noObjective')}
              </dd>
            </div>
            <div className="flex min-h-10 items-center justify-between gap-3 border-b border-cobalt-tint-3 text-sm">
              <dt className="text-ink/60">{t('plan.split')}</dt>
              <dd className="text-end font-semibold text-ink">
                {catalogEntry(splitsById.get(plan.splitId), 'plan.noSplit')}
              </dd>
            </div>
          </dl>

          <section aria-labelledby="microciclos-titulo" className="flex flex-col">
            <div className="flex items-baseline justify-between gap-2 border-b border-cobalt-tint-3 pb-2">
              <h2
                id="microciclos-titulo"
                className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60"
              >
                {t('plan.microcycles')}
              </h2>
              <span className="metric-figures text-[13px] font-semibold text-cobalt">
                {plural('plan.weekCount.one', 'plan.weekCount.other', plan.weeks.length, {
                  count: plan.weeks.length,
                })}
              </span>
            </div>

            {/* Abierta sólo la primera: es la que se mira al abrir la ficha,
                y en un mesociclo las demás repiten su forma. */}
            {plan.weeks.map((week, index) => (
              <PlanWeekRow
                key={week.number}
                week={week}
                routinesById={routinesById}
                defaultOpen={index === 0}
              />
            ))}
          </section>

          {/* La puerta a asignarlo, al pie. Se asigna desde la ficha del alumno
              —es a una persona a quien se asigna—, y desde aquí no había forma
              de llegar: el plan se veía y no se sabía qué hacer con él. */}
          {manages && (
            <p className="text-[13px] text-ink/50">
              {t('plan.assignHint')}{' '}
              <Link
                to="/students"
                className="inline-flex min-h-11 items-center font-semibold text-cobalt underline-offset-4 hover:underline"
              >
                {t('plan.goToStudents')}
              </Link>
            </p>
          )}
        </div>
      </div>

      <ConfirmDeleteDialog
        open={isDeleteOpen}
        name={plan.title}
        kind={t('plan.kind')}
        blockedReason={blockedReason}
        onOpenChange={setIsDeleteOpen}
        onConfirm={() => {
          void deletePlan(plan.id).then((result) => {
            if (result.deleted) navigate('/trainings?tab=planes')
            else setBlockedReason(result.reason)
          })
        }}
      />
    </div>
  )
}
