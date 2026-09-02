import { Link } from 'react-router-dom'
import { getShortName } from '@/shared/lib/personName'
import { cn } from '@/shared/lib/utils'
import { formatDateKey } from '@/domains/students/libs/dateKey'
import { AT_RISK_DAYS, useRetention } from '../hooks/useRetention'

/**
 * Quien ha dejado de venir. Solo composicion.
 *
 * ES LA PREGUNTA QUE MAS DINERO MUEVE en un gimnasio, y ninguna pantalla la
 * respondia. Un alumno que deja de aparecer no se da de baja: deja de renovar
 * tres semanas despues, y para entonces ya no hay conversacion que tener. La
 * cuota vencida llega tarde; esto llega antes.
 */
export function RetentionList() {
  const { entries, loading } = useRetention()

  if (loading) return null

  if (entries.length === 0) {
    return <p className="py-8 text-sm text-ink/45">Todavía no hay alumnos en el equipo.</p>
  }

  return (
    <ul className="divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3">
      {entries.map((entry) => {
        const atRisk = entry.daysSince === null || entry.daysSince >= AT_RISK_DAYS

        return (
          <li key={entry.student.id} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink">
                <Link
                  to={`/students/${entry.student.id}`}
                  className="outline-none hover:text-cobalt focus-visible:underline"
                >
                  {getShortName(entry.student.firstName, entry.student.lastName)}
                </Link>
              </p>
              <p className="truncate text-xs text-ink/45">
                {entry.lastTrained === null
                  ? 'No ha entrenado nunca'
                  : `Última sesión el ${formatDateKey(entry.lastTrained)}`}
              </p>
            </div>

            <span
              className={cn(
                'shrink-0 text-xs font-semibold',
                // Solo se enciende lo que reclama accion: pintar tambien a
                // quien vino ayer dejaria la lista sin jerarquia.
                atRisk ? 'text-danger' : 'text-ink/40'
              )}
            >
              {entry.daysSince === null
                ? '—'
                : entry.daysSince === 0
                  ? 'Hoy'
                  : `${entry.daysSince} d`}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
