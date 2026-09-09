import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface LeaveSessionLinkProps {
  /** A donde vuelve: la agenda, la ficha del alumno o el panel. */
  to: string
}

/**
 * La salida de la sesión en vivo SIN terminarla.
 *
 * La pantalla se abre sin barra de navegación —es deliberado: nada compite
 * con el reloj— y eso la dejaba sin puerta: cerrar una sesión abierta por
 * error obligaba a «terminarla», que la anotaba como completada con cero
 * series, o a usar el botón atrás del navegador, que una PWA instalada no
 * siempre tiene. Salir no escribe nada: la sesión sigue programada tal cual.
 */
export function LeaveSessionLink({ to }: LeaveSessionLinkProps) {
  const { t } = useTranslation()

  return (
    <Link
      to={to}
      aria-label={t('liveSession.leave')}
      title={t('liveSession.leave')}
      className="flex size-11 shrink-0 items-center justify-center rounded-action text-ink/50 transition-colors hover:bg-cobalt-tint-1 hover:text-ink"
    >
      <X className="size-5" />
    </Link>
  )
}
