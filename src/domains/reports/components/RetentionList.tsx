import { Link } from 'react-router-dom'
import { getShortName } from '@/shared/lib/personName'
import { cn } from '@/shared/lib/utils'
import { formatDateKey } from '@/domains/students/libs/dateKey'
import { AT_RISK_DAYS, useRetention } from '../hooks/useRetention'
import { useTranslation } from '@/shared/i18n/LanguageContext'

/**
 * Quien ha dejado de venir. Solo composicion.
 *
 * ES LA PREGUNTA QUE MAS DINERO MUEVE en un gimnasio, y ninguna pantalla la
 * respondia. Un alumno que deja de aparecer no se da de baja: deja de renovar
 * tres semanas despues, y para entonces ya no hay conversacion que tener. La
 * cuota vencida llega tarde; esto llega antes.
 */
export function RetentionList() {
  const { t } = useTranslation()
  const { entries, loading } = useRetention()

  if (loading) return null

  if (entries.length === 0) {
    return <p className="py-8 text-sm text-ink/60">{t('reports.noStudents')}</p>
  }

  return (
    <ul className="divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3">
      {entries.map((entry) => {
        const atRisk = entry.daysSince === null || entry.daysSince >= AT_RISK_DAYS

        return (
          <li key={entry.student.id} className="flex items-center gap-3 py-3">
            {/* EL ENLACE ENVUELVE LAS DOS LÍNEAS, como en `ListRow`: envolvía
                sólo el nombre y su caja medía 19 px de alto, por debajo del
                objetivo táctil de 44 que exige la regla 1.6. Así el objetivo
                es la fila y el nombre accesible es nombre y apoyo, que es lo
                que un lector de pantalla debe decir al pasar por ella. */}
            <Link
              to={`/students/${entry.student.id}`}
              className="group flex min-h-11 min-w-0 flex-1 flex-col justify-center outline-none"
            >
              <span className="truncate font-semibold text-ink group-hover:text-cobalt group-focus-visible:underline">
                {getShortName(entry.student.firstName, entry.student.lastName)}
              </span>
              <span className="truncate text-xs text-ink/60">
                {entry.lastTrained === null
                  ? t('reports.neverTrained')
                  : t('reports.lastSession', { date: formatDateKey(entry.lastTrained) })}
              </span>
            </Link>

            <span
              className={cn(
                'shrink-0 text-xs font-semibold',
                // Solo se enciende lo que reclama accion: pintar tambien a
                // quien vino ayer dejaria la lista sin jerarquia.
                atRisk ? 'text-danger' : 'text-ink/60'
              )}
            >
              {entry.daysSince === null
                ? '—'
                : entry.daysSince === 0
                  ? t('reports.today')
                  : t('reports.daysShort', { count: entry.daysSince })}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
