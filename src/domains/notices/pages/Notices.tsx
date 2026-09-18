import { useEffect, useRef, useState } from 'react'
import { PageHeader } from '@/shared/components/PageHeader'
import { useViewerContext } from '@/app/ViewerContext'
import { useNoticeInbox } from '@/shared/hooks/useNoticeInbox'
import { activeLocale } from '@/shared/i18n/activeLocale'
import { todayKey, toLocalDateKey } from '@/shared/lib/dateKey'
import { cn } from '@/shared/lib/utils'
import type { Notice, NoticeKind } from '@/shared/domain/entities/notice'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'
import { PAGE_SCROLL } from '@/shared/lib/pageScroll'

/** De qué es cada aviso. Lo dice el motivo, que es lo que se guarda. */
const NOTICE_KIND_LABEL_KEY: Record<NoticeKind, TranslationKey> = {
  dues: 'notices.kind.dues',
  general: 'notices.kind.general',
  membership: 'notices.kind.membership',
}

/**
 * La bandeja de avisos, a pantalla completa.
 *
 * ERA UN DESPLEGABLE DE 320 px colgando de la campana, con los avisos
 * apretados y sin más orden que la fecha. Un aviso es lo único que la
 * aplicación le manda a un alumno —su cuota, un recordatorio de su entrenador,
 * la aprobación de su equipo—, y leerlo en una esquina de 320 px es leerlo con
 * prisa.
 *
 * SE AGRUPA EN HOY Y ANTES, que es como se lee una bandeja: lo de hoy es lo que
 * puede requerir algo, y lo de antes es historia. Sin más tramos: con una
 * bandeja de diez avisos, «esta semana» y «este mes» serían encabezados con una
 * fila debajo.
 *
 * LO NO LEÍDO SE MARCA AL ENTRAR —abrir es el acto de leer— pero se sigue
 * VIENDO marcado mientras se está en la pantalla: apagar el punto en el mismo
 * instante en que se llega deja al que entra sin saber cuál era el aviso nuevo.
 */
export default function Notices() {
  const { t } = useTranslation()
  const { active } = useViewerContext()
  const studentId = active?.student?.id
  const { notices, markAllRead } = useNoticeInbox(studentId)

  /*
   * Los que estaban sin leer AL LLEGAR. Se toman una sola vez: `markAllRead`
   * vacía la condición un instante después, y sin esta foto la pantalla se
   * quedaría sin señalar nada.
   */
  const [newOnes, setNewOnes] = useState<Set<string>>(new Set())
  const taken = useRef(false)

  useEffect(() => {
    if (taken.current || notices.length === 0) return
    taken.current = true

    const unread = notices.filter((notice) => notice.readAt === null)
    if (unread.length === 0) return

    setNewOnes(new Set(unread.map((notice) => notice.id)))
    void markAllRead()
  }, [notices, markAllRead])

  const today = todayKey()
  const fromToday = notices.filter((notice) => dayOf(notice) === today)
  const older = notices.filter((notice) => dayOf(notice) !== today)

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      <PageHeader className="md:pb-4">
        <PageHeader.Eyebrow>
          {newOnes.size > 0
            ? t('notices.eyebrowUnread', { count: newOnes.size })
            : t('notices.eyebrow')}
        </PageHeader.Eyebrow>
        <PageHeader.Title>{t('notices.title')}</PageHeader.Title>
      </PageHeader>

      <div className={PAGE_SCROLL}>
        <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 pb-6">
          {notices.length === 0 && (
            <p className="py-10 text-center text-sm text-ink/60">
              {studentId === undefined ? t('notices.notYours') : t('notices.empty')}
            </p>
          )}

          <NoticeGroup
            id="hoy"
            heading={t('notices.today')}
            notices={fromToday}
            newOnes={newOnes}
            withTime
          />
          <NoticeGroup
            id="antes"
            heading={t('notices.before')}
            notices={older}
            newOnes={newOnes}
          />
        </div>
      </div>
    </div>
  )
}

interface NoticeGroupProps {
  /** Para atar el encabezado a su sección; el rótulo cambia con el idioma. */
  id: string
  heading: string
  notices: Notice[]
  newOnes: Set<string>
  /** Lo de hoy lleva la hora; lo de antes, el día. */
  withTime?: boolean
}

function NoticeGroup({ id, heading, notices, newOnes, withTime = false }: NoticeGroupProps) {
  const { t } = useTranslation()
  if (notices.length === 0) return null

  return (
    <section className="flex flex-col" aria-labelledby={`avisos-${id}`}>
      <h2
        id={`avisos-${id}`}
        className="border-b border-cobalt-tint-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60"
      >
        {heading}
      </h2>

      <ul className="divide-y divide-cobalt-tint-3">
        {notices.map((notice) => (
          <li key={notice.id} className="flex gap-3 py-4">
            {/* El punto ocupa su sitio siempre, leído o no: sin reservarlo, el
                texto de los leídos empieza donde no empieza el de los nuevos. */}
            <span
              aria-hidden="true"
              className={cn(
                'mt-1.5 size-2 shrink-0 rounded-full',
                newOnes.has(notice.id) ? 'bg-ember' : 'bg-transparent'
              )}
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/60">
                  {t(NOTICE_KIND_LABEL_KEY[notice.kind])}
                  {newOnes.has(notice.id) && (
                    <span className="sr-only"> {t('notices.unread')}</span>
                  )}
                </span>
                <span className="metric-figures shrink-0 text-[11px] text-ink/60">
                  {formatWhen(notice, withTime)}
                </span>
              </div>

              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink/80">
                {/* El aviso de pertenencia lo escribe el servidor con el nombre
                    del equipo como cuerpo; el texto lo pone el diccionario de
                    quien lo lee. */}
                {notice.kind === 'membership'
                  ? t('notices.membershipApproved', { crew: notice.body })
                  : notice.body}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** El día local en que se escribió, para agrupar. */
function dayOf(notice: Notice): string {
  return toLocalDateKey(new Date(notice.createdAt))
}

/** La hora si es de hoy —«09:12»—, y el día si es de antes —«lun 7»—. */
function formatWhen(notice: Notice, withTime: boolean): string {
  const when = new Date(notice.createdAt)
  return withTime
    ? when.toLocaleTimeString(activeLocale(), { hour: '2-digit', minute: '2-digit' })
    : when.toLocaleDateString(activeLocale(), { weekday: 'short', day: 'numeric' })
}
