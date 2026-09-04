import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { formatKilos } from '@/shared/lib/routineFormat'
import { estimatedOneRepMax, loadChange } from '@/shared/domain/loadProgression'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { formatDateKey } from '../libs/dateKey'
import { useLoadProgression, type NamedLoadHistory } from '../hooks/useLoadProgression'
import { LoadSparkline } from './LoadSparkline'

interface StudentLoadProgressionProps {
  studentId: string
}

/**
 * Cuánto levanta, ejercicio a ejercicio, sesión a sesión.
 *
 * EL PESO SE ANOTABA Y NO SE MIRABA. Cada serie guardaba su carga desde que la
 * sesión guiada lo pide, y el único que lo leía era el campo de la sesión
 * siguiente para dejarlo puesto. Un dato que se escribe y no tiene pantalla
 * envejece sin que nadie lo note, y éste es justo el que responde a la pregunta
 * por la que alguien paga a un entrenador: «¿estoy mejorando?».
 *
 * VA EN LA FICHA y no en un módulo aparte, por lo mismo que el progreso: quien
 * lo consulta ya está mirando a esa persona.
 */
export function StudentLoadProgression({ studentId }: StudentLoadProgressionProps) {
  const { t } = useTranslation()
  const { histories, loading } = useLoadProgression(studentId)

  if (loading) return null

  return (
    <section className="px-5 py-8" aria-labelledby="cargas-titulo">
      <h2
        id="cargas-titulo"
        className="mb-4 border-b border-cobalt-tint-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60"
      >
        {t('loads.title')}
      </h2>

      {histories.length === 0 ? (
        <p className="py-6 text-sm text-ink/45">
          {/* Se distingue «no ha entrenado» de «entrenó y no se anotó el peso»:
              lo segundo tiene arreglo y merece decirse. */}
          {t('loads.empty')}
        </p>
      ) : (
        <ul className="divide-y divide-cobalt-tint-3">
          {histories.map((history) => (
            <ExerciseLoads key={history.exerciseId} history={history} />
          ))}
        </ul>
      )}
    </section>
  )
}

interface ExerciseLoadsProps {
  history: NamedLoadHistory
}

/**
 * Un ejercicio: la carga de hoy, cuánto ha cambiado, y el detalle si se pide.
 *
 * PLEGADO POR DEFECTO. Un alumno con doce ejercicios y tres meses de historial
 * son cientos de líneas, y la pregunta corriente —«¿sube el press de banca?»— se
 * responde con la primera. El detalle está a un toque para cuando hace falta.
 *
 * Y DENTRO DEL PLIEGUE, LA GRÁFICA. Es lo que más se mira y lo que menos se
 * cuestiona, así que no puede estar en la fila cerrada compitiendo con la cifra:
 * quien abre el detalle ya ha decidido mirar este ejercicio de cerca.
 */
function ExerciseLoads({ history }: ExerciseLoadsProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const latest = history.points[history.points.length - 1]
  const oldest = history.points[0]
  const change = loadChange(history)
  const oneRepMax = estimatedOneRepMax(latest)

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full min-h-11 items-center gap-3 py-3 text-start transition-colors hover:text-cobalt"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{history.exerciseName}</p>
          <p className="metric-figures text-xs text-ink/45">
            {t('loads.lastEntry', {
              date: formatDateKey(latest.date),
              reps: latest.reps,
            })}
          </p>
        </div>

        <div className="shrink-0 text-end">
          <p className="metric-figures font-display text-xl font-bold leading-none text-ink">
            {formatKilos(latest.topWeightKg)}
            <span className="ml-1 text-xs font-semibold text-ink/40">{t('loads.kilos')}</span>
          </p>

          {/*
            El cambio SÓLO cuando lo hay. Con una sola sesión no hay progresión
            que medir, y un «0 kg» ahí se leería como «no ha subido» cuando lo
            cierto es que todavía no se sabe.
          */}
          {change !== null && change !== 0 && (
            <p
              className={cn(
                'metric-figures text-xs font-semibold',
                change > 0 ? 'text-success' : 'text-warning'
              )}
            >
              {change > 0 ? '+' : '−'}
              {formatKilos(Math.abs(change))} {t('loads.kilos')}
            </p>
          )}
        </div>

        <ChevronDown
          aria-hidden="true"
          className={cn(
            'size-4 shrink-0 text-ink/30 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="pb-3">
          <LoadSparkline
            points={history.points}
            label={t('loads.chart', {
              exercise: history.exerciseName,
              from: formatKilos(oldest.topWeightKg),
              to: formatKilos(latest.topWeightKg),
              sessions: history.points.length,
            })}
          />

          {/*
            El máximo estimado, CON SU NOMBRE Y SU LETRA PEQUEÑA. Es la cifra que
            permite comparar 60×8 con 70×4, y es también la más fácil de
            confundir con una medición: sale de una fórmula, no de nadie
            levantando ese peso. Por eso va escrito debajo en vez de en una
            ayuda que hay que ir a buscar.

            No aparece por encima de diez repeticiones: ahí la fórmula se separa
            tanto de la realidad que el número dejaría de significar algo.
          */}
          {oneRepMax !== null && (
            <div className="mt-3 border-t border-cobalt-tint-3 pt-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">
                  {t('loads.oneRepMax')}
                </span>
                <span className="metric-figures font-display text-lg font-bold text-ink">
                  {formatKilos(oneRepMax)}
                  <span className="ml-1 text-xs font-semibold text-ink/40">
                    {t('loads.kilos')}
                  </span>
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-ink/40">
                {t('loads.oneRepMaxHint')}
              </p>
            </div>
          )}

          <ol className="mt-3 ps-1">
            {/* De la más reciente hacia atrás: es como se lee un historial. */}
            {[...history.points].reverse().map((point) => (
              <li
                key={point.date}
                className="metric-figures flex items-baseline justify-between gap-3 py-1 text-xs"
              >
                <span className="text-ink/45">{formatDateKey(point.date)}</span>
                <span className="text-ink/70">
                  {t('loads.point', {
                    weight: formatKilos(point.topWeightKg),
                    reps: point.reps,
                    sets: point.sets,
                  })}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </li>
  )
}
