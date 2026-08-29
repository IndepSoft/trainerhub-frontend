import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { ArrowUpRight } from 'lucide-react'
import { getStudentInitials } from '../libs/calendar.utils'
import { SESSION_STATUS } from '../libs/sessionStatus'
import { cn } from '@/shared/lib/utils'
import type { Session } from '../types/calendar.types'

export type SessionCardVariant = 'full' | 'compact'

interface SessionCardProps {
  session: Session
  onSelect: (session: Session) => void
  /**
   * `compact` es la MISMA tarjeta a escala reducida, no otro componente: misma
   * superficie, mismo canto, misma cuña de estado y la misma respuesta al pasar.
   * Se usa en la rejilla semanal y en las sesiones cortas de la vista de día,
   * donde el alto disponible no da para la versión completa.
   */
  variant?: SessionCardVariant
}

/**
 * Tarjeta de sesión.
 *
 * Sigue la estética de la tarjeta de estudiante: superficie blanca, borde del
 * sistema, cuña diagonal, título en Condensed y datos separados por reglas.
 *
 * La cuña toma el COLOR DEL ESTADO en vez de Ember, y es deliberado: al pasar de
 * bloque teñido a tarjeta blanca se perdía el «verde = confirmada» que se leía
 * sin llegar a leer el texto, y en una agenda ese vistazo es lo que se usa.
 *
 * Ocupa todo el alto que le da su contenedor, porque quien decide su tamaño es
 * la escala de tiempo: una sesión de 60 minutos mide el doble que una de 30.
 */
export function SessionCard({ session, onSelect, variant = 'full' }: SessionCardProps) {
  const status = SESSION_STATUS[session.status]
  const statusTextClassName = status.outlineBadgeClassName.split(' ')[1]
  const isCompact = variant === 'compact'

  return (
    <button
      type="button"
      onClick={() => onSelect(session)}
      /*
       * Nombre accesible explicito. Sin el, el nombre lo componia el contenido
       * de la tarjeta y un lector de pantalla leia de corrido titulo, estado,
       * tipo, duracion y lugar como una sola frase. Asi dice lo que hace falta
       * para decidir si abrirla, y en el orden en que se decide.
       */
      aria-label={`${session.title}. ${status.label}. ${session.time}, ${session.durationMinutes} minutos`}
      className={cn(
        'group relative isolate flex h-full w-full flex-col overflow-hidden rounded-block border border-cobalt-tint-3 bg-white text-left transition-colors hover:border-cobalt/40',
        isCompact ? 'p-2' : 'p-3'
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-x-[-20%] -z-10 transition-transform duration-300 group-hover:-translate-y-0.5',
          // Anclada en pixeles al TITULO, no en porcentaje: la tarjeta mide lo
          // que dure la sesion, asi que un porcentaje la mueve segun la duracion
          // y en una sesion larga acababa cortando a la altura de las insignias.
          // «Confirmada» quedaba en verde sobre verde.
          isCompact ? 'top-1.5 h-6' : 'top-2 h-9',
          status.accentClassName
        )}
        style={{ clipPath: 'polygon(0 40%, 100% 0, 100% 60%, 0 100%)' }}
      />

      <div className="flex items-center gap-1.5">
        {isCompact ? (
          <span className={cn('shrink-0', statusTextClassName)}>{status.icon}</span>
        ) : (
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="bg-cobalt-tint-2 text-[10px] font-bold text-cobalt">
              {getStudentInitials(session.student)}
            </AvatarFallback>
          </Avatar>
        )}

        <span
          className={cn(
            'min-w-0 flex-1 truncate font-display font-bold uppercase leading-tight tracking-tight text-ink',
            isCompact ? 'text-xs' : 'text-sm'
          )}
        >
          {isCompact ? session.student : session.title}
        </span>

        {!isCompact && (
          <span className={cn('shrink-0', statusTextClassName)}>{status.icon}</span>
        )}
      </div>

      {isCompact ? (
        <span className="mt-0.5 truncate text-[10px] uppercase tracking-wider text-ink/45">
          {session.category}
        </span>
      ) : (
        <>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <span
              className={cn(
                'rounded-action border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]',
                status.outlineBadgeClassName
              )}
            >
              {status.label}
            </span>
            <span className="rounded-action border border-cobalt-tint-3 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-ink/50">
              {session.kind === 'individual' ? 'Individual' : 'Grupal'}
            </span>
          </div>

          {/* `mt-auto` empuja los datos al pie: la tarjeta ocupa el alto que le
              da la duracion, y sin esto una sesion larga dejaba un hueco debajo
              del titulo en vez de repartirse. */}
          <p className="metric-figures mt-auto flex min-w-0 items-center gap-2 pe-5 text-[11px] text-ink/55">
            <span className="shrink-0">{session.durationMinutes} min</span>
            <span className="text-ink/20">·</span>
            <span className="truncate">{session.location}</span>
          </p>

          <ArrowUpRight
            aria-hidden="true"
            className="absolute bottom-2 right-2 size-3.5 text-ink/20 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ember"
          />
        </>
      )}
    </button>
  )
}
