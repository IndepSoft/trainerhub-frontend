import type { ReactNode } from 'react'
import { Award, CalendarPlus, Clock, CreditCard, Gauge, UserPlus } from 'lucide-react'
import { ListRow } from '@/shared/components/ListRow'
import { CopyInviteButton } from '@/shared/components/CopyInviteButton'
import { useViewerContext } from '@/app/ViewerContext'
import { canEnrollMembers } from '@/shared/domain/entities/crew'
import { SubscriptionBadge } from '@/shared/components/SubscriptionBadge'
import { NODE_TITLE_KEY } from '@/domains/progress/libs/routePath'
import { describeStanding } from '@/shared/i18n/duesWording'
import { SUBSCRIPTION_PERIOD_LABEL_KEY } from '@/shared/i18n/domainLabels'
import { formatShortDateKey } from '@/shared/lib/dateKey'
import { cn } from '@/shared/lib/utils'
import { useSubscriptions } from '../hooks/useSubscriptions'
import { SCHEDULE_PARAM, sectionHref } from '../libs/studentSections'
import type { Session } from '@/shared/domain/entities/session'
import type { Student } from '@/shared/domain/entities/student'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface StudentUpNextProps {
  student: Student
  /** `undefined` mientras carga: la fila no sale, en vez de decir «nada». */
  nextSession: Session | null | undefined
  awaitingMilestone: number | null
  pendingBadgeCount: number
  flaggedCount: number
}

interface RowIconProps {
  children: ReactNode
  tone: 'cobalt' | 'danger' | 'ember'
}

const ICON_TONE: Record<RowIconProps['tone'], string> = {
  cobalt: 'text-cobalt',
  danger: 'text-danger',
  ember: 'text-ember-deep',
}

function RowIcon({ children, tone }: RowIconProps) {
  return (
    <span aria-hidden="true" className={cn('flex size-10 shrink-0 items-center justify-center', ICON_TONE[tone])}>
      {children}
    </span>
  )
}

/**
 * «Le toca»: lo que espera algo sobre este alumno, y a dónde ir a resolverlo.
 *
 * ES LA BANDEJA DEL PANEL, PARA UNA PERSONA. La bandeja junta por equipo
 * cuotas, hitos, insignias y cargas; aquí salen los mismos conceptos de uno
 * solo, y cada fila lleva a la sección de la ficha donde se decide. Nada se
 * resuelve desde aquí: esto es un índice, y por eso son filas.
 *
 * LA CUENTA, CON SU CONTROL. Sin cuenta no le llegan avisos ni ve su
 * progreso, y el enlace de invitación es lo que lo arregla: esa fila no lleva a
 * ningún sitio, se resuelve ahí mismo copiando el enlace.
 *
 * LA SESIÓN SALE SIEMPRE, la próxima o su ausencia. Que no tenga nada agendado
 * también es algo que le toca, y esa fila abre el diálogo de agendar con
 * `?agendar`: es la puerta que ese parámetro perdió con la tarjeta del padrón.
 */
export function StudentUpNext({
  student,
  nextSession,
  awaitingMilestone,
  pendingBadgeCount,
  flaggedCount,
}: StudentUpNextProps) {
  const { t, plural } = useTranslation()
  const { active, can } = useViewerContext()
  const { byStudent, standingOf, loading: loadingDues } = useSubscriptions()
  const joinToken = active?.crew.joinToken ?? null
  const canInvite =
    can('crew.invite') && active !== null && canEnrollMembers(active.crew) && joinToken !== null
  const standing = standingOf(student.id)
  const periodDays = byStudent.get(student.id)?.periodDays
  const periodKey = periodDays === undefined ? undefined : SUBSCRIPTION_PERIOD_LABEL_KEY[periodDays]
  const duesClaim = !loadingDues && (standing.state === 'overdue' || standing.state === 'dueSoon')

  return (
    <section className="px-5 py-8" aria-labelledby="le-toca-titulo">
      <h2
        id="le-toca-titulo"
        className="border-b border-cobalt-tint-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60"
      >
        {t('upNext.title')}
      </h2>

      <ul>
        {duesClaim && (
          <ListRow
            to={sectionHref('cuota')}
            replace
            primary={`${t('dues.title')} · ${describeStanding(standing, t)}`}
            secondary={
              periodKey === undefined
                ? t('upNext.duesHint')
                : `${t(periodKey)} · ${t('upNext.duesHint')}`
            }
            leading={
              <RowIcon tone={standing.state === 'overdue' ? 'danger' : 'ember'}>
                <CreditCard className="size-5" />
              </RowIcon>
            }
            trailing={<SubscriptionBadge standing={standing} brief />}
          />
        )}

        {student.profileId === null && (
          <ListRow
            primary={t('upNext.noAccount')}
            secondary={canInvite ? t('upNext.noAccountHint') : t('upNext.noAccountWait')}
            leading={
              <RowIcon tone="ember">
                <UserPlus className="size-5" />
              </RowIcon>
            }
            trailing={canInvite && joinToken !== null ? <CopyInviteButton joinToken={joinToken} /> : undefined}
          />
        )}

        {awaitingMilestone !== null && NODE_TITLE_KEY[awaitingMilestone] !== undefined && (
          <ListRow
            to={sectionHref('progreso')}
            replace
            primary={t('upNext.milestone', { node: t(NODE_TITLE_KEY[awaitingMilestone]) })}
            secondary={t('upNext.milestoneHint')}
            leading={
              <RowIcon tone="cobalt">
                <Award className="size-5" />
              </RowIcon>
            }
          />
        )}

        {pendingBadgeCount > 0 && (
          <ListRow
            to={sectionHref('progreso')}
            replace
            primary={plural('upNext.badges.one', 'upNext.badges.other', pendingBadgeCount, {
              count: pendingBadgeCount,
            })}
            secondary={t('upNext.badgesHint')}
            leading={
              <RowIcon tone="cobalt">
                <Award className="size-5" />
              </RowIcon>
            }
          />
        )}

        {flaggedCount > 0 && (
          <ListRow
            to={sectionHref('progreso')}
            replace
            primary={plural('upNext.flagged.one', 'upNext.flagged.other', flaggedCount, {
              count: flaggedCount,
            })}
            secondary={t('upNext.flaggedHint')}
            leading={
              <RowIcon tone="ember">
                <Gauge className="size-5" />
              </RowIcon>
            }
          />
        )}

        {nextSession === undefined ? null : nextSession === null ? (
          <ListRow
            to={`?${SCHEDULE_PARAM}`}
            replace
            primary={t('upNext.noSession')}
            secondary={t('upNext.noSessionHint', { name: student.firstName })}
            leading={
              <RowIcon tone="cobalt">
                <CalendarPlus className="size-5" />
              </RowIcon>
            }
          />
        ) : (
          <ListRow
            to={sectionHref('sesiones')}
            replace
            primary={t('upNext.nextSession', {
              when: `${formatShortDateKey(nextSession.date)} · ${nextSession.time}`,
            })}
            secondary={`${nextSession.title} · ${nextSession.location}`}
            leading={
              <RowIcon tone="cobalt">
                <Clock className="size-5" />
              </RowIcon>
            }
          />
        )}
      </ul>
    </section>
  )
}
