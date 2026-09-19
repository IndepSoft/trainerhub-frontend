import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useViewerContext } from '@/app/ViewerContext'
import { useNoticeInbox } from '@/shared/hooks/useNoticeInbox'
import { useTranslation } from '@/shared/i18n/LanguageContext'

/**
 * La campana: dice si hay avisos y lleva a ellos.
 *
 * ERA UN BOTÓN QUE NO HACÍA NADA, después un desplegable de 320 px, y ahora
 * LLEVA A SU PANTALLA (`CAMBIOS` §48). El desplegable apretaba en una esquina
 * lo único que la aplicación le manda a un alumno, y en un teléfono se comía
 * media pantalla sin ser una pantalla.
 *
 * SÓLO LOS PROPIOS. Se cuentan por la ficha de quien mira —`active.student`—,
 * así que un entrenador no ve aquí los avisos que él manda: los manda, no los
 * recibe. Con RLS la política es la misma, `student_id` = tu ficha.
 *
 * TODO: es una bandeja DENTRO de la aplicación. Quien no la abra no se entera;
 * correo o push son otro trabajo, y otro consentimiento.
 */
export function NotificationButton() {
  const { active } = useViewerContext()
  const { t } = useTranslation()
  const { notices } = useNoticeInbox(active?.student?.id)

  const unread = notices.filter((notice) => notice.readAt === null).length

  return (
    <Link
      to="/notices"
      className="relative inline-flex size-11 items-center justify-center rounded-action text-ink/50 transition-colors hover:bg-cobalt-tint hover:text-cobalt"
      aria-label={unread > 0 ? t('notices.unreadLabel', { count: unread }) : t('notices.title')}
    >
      <Bell className="size-5" />

      {unread > 0 && (
        /* Un punto y no el número: con más de nueve avisos la cifra no cabe
           en la esquina, y lo que hace falta saber es que hay algo. El
           recuento va en el nombre accesible y en la propia bandeja. */
        <span
          aria-hidden="true"
          className="absolute end-2.5 top-2.5 size-2 rounded-action bg-ember"
        />
      )}
    </Link>
  )
}
