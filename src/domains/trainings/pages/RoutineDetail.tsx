import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/components/PageHeader'
import { useRoutine } from '../hooks/useRoutines'
import { formatPrescription, formatRest } from '../libs/routine.utils'
import { useTrainingCatalog } from '../hooks/useTrainingCatalog'
import { useTrainingDeletion } from '../hooks/useTrainingDeletion'
import { RoutineSummary } from '../components/RoutineSummary'
import { ConfirmDeleteDialog } from '@/shared/components/ConfirmDeleteDialog'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { useViewerContext } from '@/app/ViewerContext'
import { BLOCK_METHOD_LABEL_KEY } from '@/shared/i18n/domainLabels'
import { PAGE_SCROLL } from '@/shared/lib/pageScroll'
import type { Block } from '@/shared/domain/entities/routine'
import type { Exercise } from '../types/training.types'

interface BlockSectionProps {
  block: Block
  /** Número del bloque, empezando en 1. */
  position: number
  /** Número del primer ejercicio del bloque dentro de la rutina. */
  firstExerciseNumber: number
  exercisesById: Map<string, Exercise>
}

/**
 * Un bloque de la rutina: su método en el rótulo y sus ejercicios en filas.
 *
 * SE LISTAN BLOQUES y no ejercicios sueltos. El bloque es lo que se ejecuta
 * como unidad: una superserie encadena sus ejercicios sin descanso, y aplanarla
 * en una lista numerada diría que van uno detrás de otro con su pausa, que es
 * lo contrario. Por eso la numeración de los ejercicios sigue a lo largo de la
 * rutina —es el orden en que se hacen— pero el método va en el rótulo.
 */
function BlockSection({ block, position, firstExerciseNumber, exercisesById }: BlockSectionProps) {
  const { t, plural } = useTranslation()
  const isSimple = block.method === 'simple'

  return (
    <section aria-labelledby={`bloque-${block.id}`} className="flex flex-col">
      <div className="flex items-baseline justify-between gap-2 border-b border-cobalt-tint-3 pb-2">
        <h2
          id={`bloque-${block.id}`}
          className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60"
        >
          {t('routine.blockLabel', {
            position: String(position).padStart(2, '0'),
            method: t(BLOCK_METHOD_LABEL_KEY[block.method]),
          })}
        </h2>
        {/* La cuenta sólo cuando dice algo: un bloque de un ejercicio es la
            mayoría, y «1 ejercicio» repetido en cada rótulo es ruido. */}
        {block.exercises.length > 1 && (
          <span className="metric-figures shrink-0 text-[13px] font-semibold text-cobalt">
            {plural('routine.exerciseCount.one', 'routine.exerciseCount.other', block.exercises.length, {
              count: block.exercises.length,
            })}
          </span>
        )}
      </div>

      <ol>
        {block.exercises.map((item, index) => {
          /*
           * El descanso de CADA EJERCICIO sólo tiene sentido en una serie
           * simple: en una superserie o un circuito se encadenan sin pausa, y
           * el que cuenta es el de la vuelta, que va al pie del bloque.
           */
          const details = [
            isSimple && item.restSeconds > 0
              ? t('routine.restLabel', { rest: formatRest(item.restSeconds) })
              : null,
            item.tempo ?? null,
            item.notes ?? null,
          ].filter((detail): detail is string => detail !== null && detail !== '')

          return (
            <li
              key={item.id}
              className="grid min-h-[3.25rem] grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-2.5 border-b border-cobalt-tint-3 py-2"
            >
              <span className="metric-figures font-display text-base font-extrabold text-cobalt">
                {String(firstExerciseNumber + index).padStart(2, '0')}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                {/* El nombre PARTE LÍNEA, no se trunca: es lo que se viene a
                    leer, y a 375 px la dosis con peso y RIR se lleva la mitad
                    de la fila. */}
                <span className="break-words text-[15px] font-semibold leading-snug text-ink">
                  {exercisesById.get(item.exerciseId)?.name ?? t('exercise.fallback')}
                </span>
                {/* Tempo e indicaciones, si los hay: se editan desde que tienen
                    campo, y lo que se escribe se tiene que poder leer donde se
                    prescribe. */}
                {details.length > 0 && (
                  <span className="text-xs text-ink/60">{details.join(' · ')}</span>
                )}
              </span>
              <span className="metric-figures whitespace-nowrap font-display text-base font-bold text-ink">
                {formatPrescription(item)}
              </span>
            </li>
          )
        })}
      </ol>

      {(!isSimple || block.notes) && (
        <p className="pt-2 text-xs text-ink/60">
          {!isSimple && t('routine.roundRest', { rest: formatRest(block.restAfterSeconds) })}
          {!isSimple && block.notes ? ' · ' : null}
          {block.notes}
        </p>
      )}
    </section>
  )
}

/**
 * Ficha de una rutina. Sólo composición.
 *
 * LAS CIFRAS ARRIBA, EN FRANJA, Y LOS EJERCICIOS A LA VISTA. Las cifras iban
 * apiladas —una fila de 70 px cada una— y los bloques debajo del pliegue, así
 * que lo que es la rutina se veía lo último.
 */
export default function RoutineDetail() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { can } = useViewerContext()
  // La ficha la lee cualquier miembro; lo que la cambia, quien gestiona.
  const manages = can('training.manage')
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
          {t('routine.notFound')}
        </p>
        <p className="text-sm text-ink/60">{t('routine.notFoundHint')}</p>
        <Button asChild variant="outline">
          <Link to="/trainings">{t('routine.back')}</Link>
        </Button>
      </div>
    )
  }

  // Dónde empieza cada bloque en la numeración de la rutina.
  const firstNumbers: number[] = []
  let nextNumber = 1
  for (const block of routine.blocks) {
    firstNumbers.push(nextNumber)
    nextNumber += block.exercises.length
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      <PageHeader>
        <Link
          to={manages ? '/trainings' : '/progress'}
          className="-ms-2 mb-3 inline-flex h-11 items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60 transition-colors hover:text-cobalt"
        >
          <ArrowLeft className="size-4" />
          {manages ? t('routine.plural') : t('nav.progress')}
        </Link>

        <PageHeader.Content>
          <PageHeader.Eyebrow>{t('routine.title')}</PageHeader.Eyebrow>
          <PageHeader.Title className="text-3xl">{routine.title}</PageHeader.Title>

          {manages && (
            <PageHeader.Actions>
              <PageHeader.SecondaryAction
                icon={Trash2}
                label={t('common.delete')}
                tone="danger"
                onClick={() => {
                  setBlockedReason(routineDeletionBlocker(routine.id))
                  setIsDeleteOpen(true)
                }}
              />
              <PageHeader.SecondaryAction
                icon={Pencil}
                label={t('common.edit')}
                to={`/trainings/${routine.id}/edit`}
              />
              {/* «Usar en una sesion» navega a la agenda con la rutina en la
                  URL: esta ficha no puede abrir el dialogo de la agenda, que vive
                  en otro dominio, pero si decirle con que llegar. */}
              <PageHeader.PrimaryAction
                icon={Copy}
                label={t('routine.useInSession')}
                shortLabel={t('routine.useInSessionShort')}
                to={`/calendar?routine=${routine.id}`}
              />
            </PageHeader.Actions>
          )}
        </PageHeader.Content>

        {/* La descripcion, debajo y a todo el ancho, y solo si la hay. */}
        {routine.description !== '' && (
          <PageHeader.Description>{routine.description}</PageHeader.Description>
        )}
      </PageHeader>

      <div className={PAGE_SCROLL}>
        <RoutineSummary routine={routine} />

        <div className="flex flex-col gap-6 px-5 pb-8 pt-6">
          {routine.blocks.map((block, index) => (
            <BlockSection
              key={block.id}
              block={block}
              position={index + 1}
              firstExerciseNumber={firstNumbers[index]}
              exercisesById={exercisesById}
            />
          ))}

          {/* Qué se hace con ella, al pie: se lee una vez, y arriba empujaba
              los ejercicios, que son lo que se viene a mirar. */}
          {manages && (
            <p className="text-[13px] text-ink/60">
              {t('routine.assignHint')}{' '}
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
        name={routine.title}
        kind={t('routine.kind')}
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
