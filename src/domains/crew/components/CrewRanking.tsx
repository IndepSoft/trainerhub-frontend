import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { getInitials, getShortName } from '@/shared/lib/personName'
import { cn } from '@/shared/lib/utils'
import { useCrewRanking } from '../hooks/useCrewRanking'
import type { ProgressPeriod } from '@/shared/domain/ports/ScoreRepository'
import type { Cohort } from '@/shared/domain/entities/progress'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'

const PERIOD_LABEL_KEY: Record<ProgressPeriod, TranslationKey> = {
  week: 'crew.period.week',
  month: 'crew.period.month',
  all: 'crew.period.all',
}

/** De más reciente a más largo: lo ganable primero. */
const PERIODS: ProgressPeriod[] = ['week', 'month', 'all']

const COHORT_LABEL_KEY: Record<Cohort, TranslationKey> = {
  youth: 'cohort.youth',
  adult: 'cohort.adult',
  senior: 'cohort.senior',
}

interface CrewRankingProps {
  /** La ficha de quien mira, para señalar su fila. `null` si entrena. */
  viewerStudentId: string | null
  /** La cohorte de quien mira, para comparar entre iguales por defecto. */
  viewerCohort: Cohort | null
}

/**
 * La clasificación del equipo.
 *
 * POR PERIODO, Y LA SEMANA PRIMERO. Un ranking por experiencia total se congela:
 * quien lleva dos años gana siempre y quien entra hoy no puede alcanzarle nunca,
 * así que a las tres semanas deja de mirarlo. «Siempre» sigue estando, detrás,
 * que es donde no hace daño.
 *
 * SÓLO ESFUERZO: sesiones completadas y experiencia. Nunca peso ni grasa
 * corporal. Comparar cuerpos en público hace daño a quien más habría que cuidar,
 * y además no mide el trabajo de nadie.
 *
 * El equipo puede apagarlo entero —`rankingEnabled`—, y quien monta esto lo
 * comprueba antes: en un grupo de rehabilitación o de salud general, competir no
 * es lo que hace falta.
 */
export function CrewRanking({ viewerStudentId, viewerCohort }: CrewRankingProps) {
  const { t, plural } = useTranslation()
  const { entries, period, setPeriod, ownCohortOnly, setOwnCohortOnly, loading } =
    useCrewRanking(viewerCohort)

  const withEffort = entries.filter((entry) => entry.completedSessions > 0)

  return (
    <section className="space-y-4" aria-labelledby="ranking-titulo">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2
          id="ranking-titulo"
          className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60"
        >
          {t('crew.ranking')}
        </h2>

        <div role="group" aria-label={t('crew.rankingPeriod')} className="flex gap-1">
          {PERIODS.map((candidate) => (
            <button
              key={candidate}
              type="button"
              aria-pressed={candidate === period}
              onClick={() => setPeriod(candidate)}
              className={cn(
                'inline-flex min-h-11 items-center rounded-action px-3 text-xs font-semibold uppercase tracking-wider transition-colors',
                candidate === period
                  ? 'bg-cobalt text-white'
                  : 'text-ink/45 hover:bg-cobalt-tint hover:text-cobalt'
              )}
            >
              {t(PERIOD_LABEL_KEY[candidate])}
            </button>
          ))}
        </div>
      </div>

      {/* Entre iguales o todo el equipo. Solo quien tiene cohorte elige: al
          entrenador, y a quien no dijo su fecha, se les enseña a todos. */}
      {viewerCohort !== null && (
        <div role="group" aria-label={t('crew.rankingScope')} className="flex gap-1">
          {[true, false].map((only) => (
            <button
              key={String(only)}
              type="button"
              aria-pressed={only === ownCohortOnly}
              onClick={() => setOwnCohortOnly(only)}
              className={cn(
                'inline-flex min-h-11 items-center rounded-action px-3 text-xs font-semibold uppercase tracking-wider transition-colors',
                only === ownCohortOnly
                  ? 'bg-ink text-bone'
                  : 'text-ink/45 hover:bg-cobalt-tint hover:text-cobalt'
              )}
            >
              {only ? t(COHORT_LABEL_KEY[viewerCohort]) : t('crew.rankingWholeCrew')}
            </button>
          ))}
        </div>
      )}

      {!loading && withEffort.length === 0 ? (
        <p className="py-6 text-sm text-ink/45">
          {/* Se distingue «nadie ha entrenado ESTE tramo» de «nadie ha entrenado
              nunca»: en un ranking semanal, el lunes por la mañana está vacío
              siempre y eso no es un fallo. */}
          {period === 'all'
            ? t('crew.rankingEmpty')
            : t('crew.rankingPeriodEmpty')}
        </p>
      ) : (
        <ol className="divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3">
          {withEffort.map((entry, index) => {
            const isViewer = entry.studentId === viewerStudentId

            return (
              <li
                key={entry.studentId}
                className={cn(
                  'flex items-center gap-3 py-3',
                  // La fila propia se marca: en una lista de veinte nombres, el
                  // dato que se busca primero es el de uno mismo.
                  isViewer && '-mx-2 rounded-block bg-cobalt-tint px-2'
                )}
              >
                <span className="metric-figures w-6 shrink-0 text-center font-display text-lg font-extrabold text-ink/30">
                  {index + 1}
                </span>

                <Avatar className="size-10 shrink-0">
                  <AvatarImage src={entry.photoUrl} alt="" />
                  <AvatarFallback className="bg-cobalt-tint-2 text-xs text-cobalt">
                    {getInitials(entry.firstName, entry.lastName)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">
                    {getShortName(entry.firstName, entry.lastName)}
                  </p>
                  <p className="text-xs text-ink/45">
                    {plural(
                      'crew.sessionCount.one',
                      'crew.sessionCount.other',
                      entry.completedSessions,
                      { count: entry.completedSessions }
                    )}
                  </p>
                </div>

                <span className="metric-figures shrink-0 font-display text-sm font-bold text-cobalt">
                  {entry.experience} XP
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
