import { useMemo } from 'react'
import { ListRow } from '@/shared/components/ListRow'
import { MetricFigure } from '@/shared/components/MetricFigure'
import { MetricStrip } from '@/shared/components/MetricStrip'
import { formatMonthOfDateKey, formatShortDateKey, todayKey } from '@/shared/lib/dateKey'
import { historyMonths, type HistoryEntry } from '../libs/sessionHistory'
import { useTranslation, type Translate } from '@/shared/i18n/LanguageContext'

interface SessionHistoryProps {
  /** Las sesiones cerradas, de la más reciente a la más antigua. */
  entries: HistoryEntry[]
}

/**
 * Lo que ya se entrenó, mes a mes.
 *
 * NO EXISTÍA. El progreso enseñaba el nivel, la racha y las insignias —lo que
 * el esfuerzo produce— y en ningún sitio el esfuerzo en sí: quien preguntaba
 * «¿cuántas llevo este mes?» tenía que contarlas en el calendario, sesión por
 * sesión, y el calendario es del entrenador.
 *
 * CADA FILA DICE LO QUE SE MIDIÓ y lo que sumó: series hechas sobre previstas,
 * minutos y puntos. Nada derivado al vuelo salvo los minutos, que son los
 * segundos redondeados.
 *
 * Las filas NO LLEVAN A NINGÚN SITIO: la sesión cerrada no tiene ficha propia
 * —lo que ocurrió está aquí entero— y una flecha prometería una pantalla que no
 * existe.
 */
export function SessionHistory({ entries }: SessionHistoryProps) {
  const { t } = useTranslation()
  const months = useMemo(() => historyMonths(entries), [entries])

  const today = todayKey()
  const thisMonth = entries.filter((entry) => entry.day.startsWith(today.slice(0, 7))).length

  return (
    <div className="flex flex-col gap-6 pt-2">
      <MetricStrip columns={2}>
        <MetricFigure
          label={t('progress.historyTotal')}
          value={entries.length}
          unit={t('progress.historyDone')}
        />
        <MetricFigure
          label={t('progress.historyThisMonth')}
          value={thisMonth}
          unit={t('progress.historyUnit')}
        />
      </MetricStrip>

      {entries.length === 0 ? (
        <p className="py-8 text-sm text-ink/45">{t('progress.historyEmpty')}</p>
      ) : (
        months.map((month) => (
          <section key={month.month} className="flex flex-col" aria-labelledby={`mes-${month.month}`}>
            <div className="flex items-baseline justify-between gap-2 border-b border-cobalt-tint-3 pb-2">
              <h3
                id={`mes-${month.month}`}
                className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60"
              >
                {formatMonthOfDateKey(month.day, today)}
              </h3>
              <span className="metric-figures text-[13px] font-semibold text-cobalt">
                {month.points} XP
              </span>
            </div>

            <ul>
              {month.entries.map((entry) => (
                <ListRow
                  key={entry.sessionId}
                  primary={entry.title}
                  secondary={describeWork(entry, t)}
                  leading={
                    <span className="metric-figures w-14 shrink-0 text-[11px] font-bold uppercase tracking-wider text-ink/45">
                      {formatShortDateKey(entry.day)}
                    </span>
                  }
                  trailing={
                    <span className="metric-figures shrink-0 font-display text-sm font-bold text-cobalt">
                      {/* Sin puntuación se pinta un guion: las sesiones cerradas
                          antes de que el servidor puntuara no valen cero. */}
                      {entry.points === null ? '—' : `+${entry.points}`}
                      <span className="ml-1 font-sans text-[11px] font-medium text-ink/45">XP</span>
                    </span>
                  }
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}

/**
 * «12/12 series · 52 min», y sólo los minutos en cardio, que no se programa en
 * series: «0/0 series» diría que no se hizo nada.
 */
function describeWork(entry: HistoryEntry, t: Translate): string {
  if (entry.totalSets === 0) return t('progress.historyMinutes', { minutes: entry.minutes })
  return t('progress.historySets', {
    done: entry.completedSets,
    total: entry.totalSets,
    minutes: entry.minutes,
  })
}
