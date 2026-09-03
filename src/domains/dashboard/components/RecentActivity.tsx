import { Timeline, TimelineEntry } from '@/shared/components/Timeline'
import { SectionHeading } from './SectionHeading'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import type { RecentActivityEntry } from '../types/dashboard.types'

interface RecentActivityProps {
  activities: RecentActivityEntry[]
}

/**
 * Lo que ya ha pasado: las sesiones completadas, de la mas nueva a la mas vieja.
 *
 * Era una lista escrita a mano -«Nueva rutina creada, hace 2 horas»- que decia
 * lo mismo pasara lo que pasara. Ahora es exactamente lo que ha ocurrido, que es
 * lo que la seccion promete.
 */
export function RecentActivity({ activities }: RecentActivityProps) {
  const { t } = useTranslation()

  return (
    <section className="flex-1">
      <SectionHeading>{t('dashboard.recentActivity')}</SectionHeading>

      {/* Vacia se explica, en vez de dejar un titulo suelto: al empezar no hay
          nada completado todavia, y un hueco mudo se lee como un fallo. */}
      {activities.length === 0 && (
        <p className="pt-5 text-sm text-ink/40">
          {t('dashboard.recentEmpty')}
        </p>
      )}

      <div className="pt-5">
        <Timeline>
          {activities.map((activity, index) => (
            <TimelineEntry
              key={activity.id}
              stamp={activity.timeAgo}
              state="done"
              isLast={index === activities.length - 1}
            >
              <p className="text-ink">{activity.event}</p>
            </TimelineEntry>
          ))}
        </Timeline>
      </div>
    </section>
  )
}
