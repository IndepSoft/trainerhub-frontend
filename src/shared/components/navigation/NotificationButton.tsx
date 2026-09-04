import { useCallback, useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { container } from '@/app/container'
import { useViewerContext } from '@/app/ViewerContext'
import { cn } from '@/shared/lib/utils'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { activeLocale } from '@/shared/i18n/activeLocale'
import type { Notice } from '@/shared/domain/entities/notice'

/**
 * La campana: los avisos privados de quien mira.
 *
 * ERA UN BOTÓN QUE NO HACÍA NADA. Ahora existe porque tenía que existir: desde
 * la ficha de un alumno se le puede mandar un recordatorio de cuota, y un aviso
 * que no llega a ninguna parte no es un aviso. Esto es el otro extremo del hilo.
 *
 * SÓLO LOS PROPIOS. Se piden por la ficha de quien mira —`active.student`—, así
 * que un entrenador no ve aquí los avisos que él manda: los manda, no los
 * recibe. Con RLS la política es la misma, `student_id` = tu ficha.
 *
 * TODO: es una bandeja DENTRO de la aplicación. Quien no la abra no se entera;
 * correo o push son otro trabajo, y otro consentimiento.
 */
export function NotificationButton() {
  const { active } = useViewerContext()
  const { t } = useTranslation()
  const studentId = active?.student?.id

  const [notices, setNotices] = useState<Notice[]>([])
  const [open, setOpen] = useState(false)

  const load = useCallback(async (): Promise<void> => {
    if (studentId === undefined) {
      setNotices([])
      return
    }
    setNotices(await container.notices.findForStudent(studentId))
  }, [studentId])

  useEffect(() => {
    void load()
    return container.notices.onChange(() => {
      void load()
    })
  }, [load])

  const unread = notices.filter((notice) => notice.readAt === null).length

  const handleOpenChange = (next: boolean) => {
    setOpen(next)

    /*
     * Se marcan al ABRIR y no al cerrar: abrir es el acto de leer. Esperar al
     * cierre deja el contador encendido mientras se están leyendo, que parece
     * que no ha funcionado.
     */
    if (next && studentId !== undefined && unread > 0) {
      void container.notices.markAllRead(studentId)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        className="relative inline-flex size-11 items-center justify-center rounded-action text-ink/50 transition-colors hover:bg-cobalt-tint hover:text-cobalt"
        aria-label={
          unread > 0 ? t('notices.unreadLabel', { count: unread }) : t('notices.title')
        }
      >
        <Bell className="size-5" />

        {unread > 0 && (
          /* Un punto y no el número: con más de nueve avisos la cifra no cabe
             en la esquina, y lo que hace falta saber es que hay algo. El
             recuento va en el nombre accesible y en la cabecera de la lista. */
          <span
            aria-hidden="true"
            className="absolute end-2.5 top-2.5 size-2 rounded-action bg-ember"
          />
        )}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <p className="border-b border-cobalt-tint-3 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
          {t('notices.title')}
        </p>

        {notices.length === 0 ? (
          <p className="px-4 py-6 text-sm text-ink/45">
            {studentId === undefined ? t('notices.notYours') : t('notices.empty')}
          </p>
        ) : (
          <ul className="max-h-80 divide-y divide-cobalt-tint-3 overflow-y-auto">
            {notices.map((notice) => (
              <li
                key={notice.id}
                className={cn('px-4 py-3', notice.readAt === null && 'bg-cobalt-tint')}
              >
                <p className="whitespace-pre-line text-sm leading-relaxed text-ink/80">
                  {notice.body}
                </p>
                <p className="mt-1 text-[11px] text-ink/40">
                  {new Date(notice.createdAt).toLocaleDateString(activeLocale(), {
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
