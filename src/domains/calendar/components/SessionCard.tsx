import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { ArrowUpRight } from 'lucide-react'
import { getStudentInitials } from '../libs/calendar.utils'
import { SESSION_STATUS } from '../libs/sessionStatus'
import { cn } from '@/shared/lib/utils'
import type { Session } from '../types/calendar.types'

interface SessionCardProps {
  session: Session
  onSelect: (session: Session) => void
}

/**
 * Tarjeta de sesión.
 *
 * Sigue la estética de la tarjeta de estudiante: superficie blanca, borde del
 * sistema, cuña diagonal, título en Condensed, rejilla de datos separada por
 * reglas e insignias de contorno.
 *
 * La diferencia con aquella es deliberada: la cuña toma el COLOR DEL ESTADO en
 * vez de Ember. Al pasar de bloque teñido a tarjeta blanca se perdía el «verde
 * = confirmada» que se leía sin llegar a leer el texto, y en una agenda ese
 * vistazo es justamente lo que se usa. La cuña lo devuelve sin volver a teñir
 * la tarjeta entera.
 *
 * Es un `<button>` y no una tarjeta con enlace estirado porque abre un diálogo,
 * no navega: no hay URL a la que apuntar.
 */
export function SessionCard({ session, onSelect }: SessionCardProps) {
  const status = SESSION_STATUS[session.status]

  return (
    <button
      type="button"
      onClick={() => onSelect(session)}
      className="group relative isolate w-full overflow-hidden rounded-block border border-cobalt-tint-3 bg-white text-left transition-colors hover:border-cobalt/40"
    >
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-x-[-15%] top-[18%] -z-10 h-14 transition-transform duration-300 group-hover:-translate-y-0.5',
          status.accentClassName
        )}
        style={{ clipPath: 'polygon(0 42%, 100% 0, 100% 58%, 0 100%)' }}
      />

      <div className="flex items-start justify-between gap-2 p-3 pb-0">
        {/*
          El AvatarImage apuntaba a /generic-placeholder-icon.png, que no existe
          en public/ y devolvia 404 en cada sesion pintada. Se deja solo el
          fallback con las iniciales hasta que haya fotos reales.
        */}
        <Avatar className="size-9 shrink-0">
          <AvatarFallback className="bg-cobalt-tint-2 text-[11px] font-bold text-cobalt">
            {getStudentInitials(session.student)}
          </AvatarFallback>
        </Avatar>

        <span className={cn('shrink-0', status.outlineBadgeClassName.split(' ')[1])}>
          {status.icon}
        </span>
      </div>

      <h4 className="mt-2 px-3 font-display text-base font-bold uppercase leading-[1.05] tracking-tight text-ink">
        {session.title}
      </h4>

      <div className="mt-2 flex flex-wrap gap-1.5 px-3 pb-3">
        <span
          className={cn(
            'rounded-action border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]',
            status.outlineBadgeClassName
          )}
        >
          {status.label}
        </span>
        <span className="rounded-action border border-cobalt-tint-3 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink/50">
          {session.kind === 'individual' ? 'Individual' : 'Grupal'}
        </span>
      </div>

      {/* `min-w-0` en las dos celdas: sin el, un lugar largo empuja la rejilla
          por encima del ancho disponible. Ya paso en esta misma vista. */}
      <dl className="grid grid-cols-2 divide-x divide-cobalt-tint-3 border-t border-cobalt-tint-3">
        <div className="min-w-0 px-3 py-2">
          <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink/40">
            Duración
          </dt>
          <dd className="metric-figures truncate text-sm font-semibold text-ink">
            {session.durationMinutes} min
          </dd>
        </div>
        {/* `pe-8` reserva el hueco de la flecha, que va posicionada sobre esta
            celda: sin el, se solapaba con el nombre del lugar. */}
        <div className="min-w-0 px-3 py-2 pe-8">
          <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink/40">
            Lugar
          </dt>
          <dd className="truncate text-sm text-ink/70">{session.location}</dd>
        </div>
      </dl>

      <ArrowUpRight
        aria-hidden="true"
        className="absolute bottom-2.5 right-2.5 size-4 text-ink/20 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ember"
      />
    </button>
  )
}
