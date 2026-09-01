import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { getInitials, getShortName } from '@/shared/lib/personName'
import { cn } from '@/shared/lib/utils'
import { useCrewRanking } from '../hooks/useCrewRanking'
import type { RankingPeriod } from '@/shared/domain/ports/RankingRepository'

const PERIOD_LABEL: Record<RankingPeriod, string> = {
  week: 'Esta semana',
  month: 'Este mes',
  all: 'Siempre',
}

/** De más reciente a más largo: lo ganable primero. */
const PERIODS: RankingPeriod[] = ['week', 'month', 'all']

interface CrewRankingProps {
  /** La ficha de quien mira, para señalar su fila. `null` si entrena. */
  viewerStudentId: string | null
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
export function CrewRanking({ viewerStudentId }: CrewRankingProps) {
  const { entries, period, setPeriod, loading } = useCrewRanking()

  const withEffort = entries.filter((entry) => entry.completedSessions > 0)

  return (
    <section className="space-y-4" aria-labelledby="ranking-titulo">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2
          id="ranking-titulo"
          className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60"
        >
          Ranking
        </h2>

        <div role="group" aria-label="Periodo del ranking" className="flex gap-1">
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
              {PERIOD_LABEL[candidate]}
            </button>
          ))}
        </div>
      </div>

      {!loading && withEffort.length === 0 ? (
        <p className="py-6 text-sm text-ink/45">
          {/* Se distingue «nadie ha entrenado ESTE tramo» de «nadie ha entrenado
              nunca»: en un ranking semanal, el lunes por la mañana está vacío
              siempre y eso no es un fallo. */}
          {period === 'all'
            ? 'Todavía no hay sesiones completadas en el equipo.'
            : 'Nadie ha entrenado en este periodo todavía. Se llena solo.'}
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
                    {entry.completedSessions}{' '}
                    {entry.completedSessions === 1 ? 'sesión' : 'sesiones'}
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
