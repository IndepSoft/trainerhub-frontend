import { useState } from 'react'
import { PauseCircle, ShieldCheck } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { useStudentRoute } from '../hooks/useStudentRoute'
import { ROUTE_NAME_KEY } from '@/domains/progress/libs/routePath'
import { badgeCatalog } from '@/domains/progress/data/badgeCatalog'
import {
  PROGRESS_ROUTES,
  ROUTE_NODES,
  isProgressRouteCode,
} from '@/shared/domain/entities/progress'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'

interface StudentRouteSectionProps {
  studentId: string
}

const PAUSE_REASON_KEY: Record<'injury' | 'travel' | 'wildcard', TranslationKey> = {
  injury: 'studentRoute.reason.injury',
  travel: 'studentRoute.reason.travel',
  wildcard: 'studentRoute.reason.wildcard',
}

const NODE_TITLE_KEY: Record<number, TranslationKey> = {
  1: 'route.node.initiation',
  2: 'route.node.consolidation',
  3: 'route.node.mastery',
  4: 'route.node.master',
}

/**
 * La ruta de un alumno, vista por quien le entrena.
 *
 * ES LA MANO DEL ENTRENADOR SOBRE EL PROGRESO: elegir la ruta cuando el
 * objetivo del plan no la dice, validar el hito del siguiente nodo —sin esa
 * validación los números no abren nada—, confirmar una insignia de Platino o
 * Diamante, y dar por buena una carga que la regla marcó como salto.
 *
 * Todo lo que se pulsa aquí lo comprueba la base: sin `students.manage`, las
 * funciones responden `forbidden`. Esto sólo evita ofrecer lo que va a fallar.
 */
export function StudentRouteSection({ studentId }: StudentRouteSectionProps) {
  const { t } = useTranslation()
  const {
    progress,
    pendingBadges,
    flagged,
    loading,
    saving,
    error,
    chooseRoute,
    validateMilestone,
    validateBadge,
    acceptLoadJump,
    pauses,
    pauseStreak,
  } = useStudentRoute(studentId)
  const [notes, setNotes] = useState('')
  const [pauseFrom, setPauseFrom] = useState('')
  const [pauseTo, setPauseTo] = useState('')
  const [pauseReason, setPauseReason] = useState<'injury' | 'travel'>('injury')

  if (loading || progress === null) return null

  const nextNode = ROUTE_NODES.find((node) => node.position === progress.position + 1)
  const nextValidated = nextNode !== undefined && progress.validatedPositions.includes(nextNode.position)

  return (
    <section className="px-5 py-8" aria-labelledby="ruta-alumno-titulo">
      <h2
        id="ruta-alumno-titulo"
        className="mb-4 border-b border-cobalt-tint-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60"
      >
        {t('studentRoute.title')}
      </h2>

      {error !== null && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/55">
            {t('studentRoute.route')}
          </span>
          {/* Se elige a mano cuando el objetivo del plan no la dice, o cuando
              el entrenador sabe mas que el plan. Cambiarla reinicia los puntos
              de la ruta: se dice antes de tocar. */}
          <Select
            value={progress.routeCode}
            onValueChange={(value) => {
              if (isProgressRouteCode(value)) void chooseRoute(value)
            }}
            disabled={saving}
          >
            <SelectTrigger className="mt-1.5 w-full" aria-label={t('studentRoute.route')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROGRESS_ROUTES.map((route) => (
                <SelectItem key={route} value={route}>
                  {t(ROUTE_NAME_KEY[route])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-xs text-ink/50">{t('studentRoute.routeHint')}</p>
        </div>

        <dl className="space-y-1 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-ink/55">{t('studentRoute.node')}</dt>
            <dd className="font-semibold text-ink">{t(NODE_TITLE_KEY[progress.position])}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink/55">{t('route.criterion.points')}</dt>
            <dd className="metric-figures font-semibold text-ink">
              {progress.points}
              {nextNode !== undefined && <span className="text-ink/45">/{nextNode.pointsRequired}</span>}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink/55">{t('route.criterion.weeks')}</dt>
            <dd className="metric-figures font-semibold text-ink">
              {progress.adherentWeeks}
              {nextNode !== undefined && <span className="text-ink/45">/{nextNode.weeksRequired}</span>}
            </dd>
          </div>
        </dl>
      </div>

      {nextNode !== undefined && (
        <div className="mt-6 rounded-block border border-cobalt-tint-3 bg-surface p-4">
          <p className="text-sm font-semibold text-ink">
            {t('studentRoute.nextMilestone', { node: t(NODE_TITLE_KEY[nextNode.position]) })}
          </p>
          {nextValidated ? (
            <p className="mt-1 flex items-center gap-2 text-sm text-cobalt">
              <ShieldCheck className="size-4" />
              {t('studentRoute.validated')}
            </p>
          ) : (
            <>
              <p className="mt-1 text-xs text-ink/55">{t('studentRoute.validateHint')}</p>
              <label className="mt-3 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/55">
                {t('studentRoute.notes')}
                <input
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  maxLength={300}
                  className="mt-1.5 block h-11 w-full rounded-action border border-cobalt-tint-3 bg-surface px-3 text-sm font-normal normal-case tracking-normal text-ink"
                />
              </label>
              <Button
                className="mt-3 gap-2"
                disabled={saving}
                onClick={() => void validateMilestone(nextNode.position, notes.trim())}
              >
                <ShieldCheck className="size-4" />
                {t('studentRoute.validate', { node: t(NODE_TITLE_KEY[nextNode.position]) })}
              </Button>
            </>
          )}
        </div>
      )}

      {pendingBadges.length > 0 && (
        <div className="mt-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/55">
            {t('studentRoute.pendingBadges')}
          </h3>
          <ul className="mt-2 divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3">
            {pendingBadges.map((badge) => {
              const definition = badgeCatalog.find((candidate) => candidate.code === badge.code)
              return (
                <li key={badge.code} className="flex items-center justify-between gap-3 py-3">
                  <span className="text-sm text-ink">
                    {definition === undefined ? badge.code : t(definition.nameKey)}
                  </span>
                  <Button variant="outline" size="sm" disabled={saving} onClick={() => void validateBadge(badge.code)}>
                    {t('studentRoute.confirmBadge')}
                  </Button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/*
        Modo lesion: los dias del tramo no rompen la racha ni suman. Lo escribe
        quien gestiona porque es quien sabe que paso; el alumno tiene su comodin
        para un dia suelto.
      */}
      <div className="mt-6 rounded-block border border-cobalt-tint-3 bg-surface p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <PauseCircle className="size-4" />
          {t('studentRoute.pauseTitle')}
        </p>
        <p className="mt-1 text-xs text-ink/55">{t('studentRoute.pauseHint')}</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/55">
            {t('studentRoute.pauseFrom')}
            <input
              type="date"
              value={pauseFrom}
              onChange={(event) => setPauseFrom(event.target.value)}
              className="mt-1.5 block h-11 w-full rounded-action border border-cobalt-tint-3 bg-surface px-3 text-sm font-normal normal-case tracking-normal text-ink"
            />
          </label>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/55">
            {t('studentRoute.pauseTo')}
            <input
              type="date"
              value={pauseTo}
              onChange={(event) => setPauseTo(event.target.value)}
              className="mt-1.5 block h-11 w-full rounded-action border border-cobalt-tint-3 bg-surface px-3 text-sm font-normal normal-case tracking-normal text-ink"
            />
          </label>
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/55">
              {t('studentRoute.pauseReason')}
            </span>
            <Select value={pauseReason} onValueChange={(value) => setPauseReason(value === 'travel' ? 'travel' : 'injury')}>
              <SelectTrigger className="mt-1.5 w-full" aria-label={t('studentRoute.pauseReason')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="injury">{t('studentRoute.reason.injury')}</SelectItem>
                <SelectItem value="travel">{t('studentRoute.reason.travel')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          variant="outline"
          className="mt-3 gap-2"
          disabled={saving || pauseFrom === '' || pauseTo === '' || pauseTo < pauseFrom}
          onClick={() => void pauseStreak(pauseFrom, pauseTo, pauseReason)}
        >
          <PauseCircle className="size-4" />
          {t('studentRoute.pause')}
        </Button>
        {pauses.length > 0 && (
          <ul className="mt-3 divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3">
            {pauses.map((pause) => (
              <li key={pause.fromDay} className="metric-figures flex items-center justify-between gap-3 py-2 text-sm text-ink">
                <span>
                  {pause.fromDay}
                  {pause.toDay !== pause.fromDay && ` – ${pause.toDay}`}
                </span>
                <span className="text-xs uppercase tracking-wider text-ink/55">
                  {t(PAUSE_REASON_KEY[pause.reason])}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {flagged.length > 0 && (
        <div className="mt-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ember-deep">
            {t('studentRoute.flagged')}
          </h3>
          <p className="mt-1 text-xs text-ink/55">{t('studentRoute.flaggedHint')}</p>
          <ul className="mt-2 divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3">
            {flagged.map((score) => (
              <li key={score.sessionId} className="flex items-center justify-between gap-3 py-3">
                <span className="metric-figures text-sm text-ink">
                  {t('studentRoute.flaggedSession', { date: score.completedOn, points: score.points })}
                </span>
                <Button variant="outline" size="sm" disabled={saving} onClick={() => void acceptLoadJump(score.sessionId)}>
                  {t('studentRoute.acceptJump')}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
