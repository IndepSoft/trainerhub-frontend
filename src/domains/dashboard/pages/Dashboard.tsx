import { IndicatorList } from '../components/IndicatorList'
import { UpcomingSessions } from '../components/UpcomingSessions'
import { RecentActivity } from '../components/RecentActivity'
import { useDashboardSummary } from '../hooks/useDashboardSummary'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { usePullToRefresh } from '@/shared/hooks/usePullToRefresh'
import { PullToRefreshIndicator } from '@/shared/components/PullToRefreshIndicator'
import { PageHeader } from '@/shared/components/PageHeader'
import { PendingWorkSection } from '../components/PendingWorkSection'
import { FirstSteps } from '../components/FirstSteps'
import { useViewerContext } from '@/app/ViewerContext'

export default function Dashboard() {
  const { t } = useTranslation()
  const { active, can } = useViewerContext()
  const { summary, refresh } = useDashboardSummary()
  // La bandeja es de quien gestiona alumnos: es donde se resuelve casi todo.
  const managesStudents = can('students.manage')
  const { pullDistance, isRefreshing, willRefresh, handlers } = usePullToRefresh({
    onRefresh: refresh,
  })

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      <PageHeader>
        <PageHeader.Eyebrow>{t('dashboard.eyebrow')}</PageHeader.Eyebrow>
        <PageHeader.Title>{t('dashboard.title')}</PageHeader.Title>
      </PageHeader>

      {/* Contenedor de scroll de la pagina. Es un div y no un <main>: el
          landmark ya lo pinta SidebarInset desde RootLayout. */}
      {/* Los manejadores van en el contenedor de desplazamiento, no en la
          pagina: el hook necesita leer su `scrollTop` para saber si esta arriba
          del todo, y solo entonces activar el gesto. */}
      <div className="flex-1 overflow-auto" {...handlers}>
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
          willRefresh={willRefresh}
        />

        <IndicatorList indicators={summary.indicators} />

        {/* Mientras falte algo del arranque, se dice en orden; despues no. */}
        <FirstSteps crew={active?.crew ?? null} />

        <div className="flex flex-col gap-10 px-5 py-8 lg:flex-row lg:gap-12">
          {/* La bandeja primero: es lo unico de esta pantalla que espera una
              decision. Lo demas se mira; esto se atiende. */}
          <PendingWorkSection enabled={managesStudents} />
          <UpcomingSessions sessions={summary.upcomingSessions} />
          <RecentActivity activities={summary.recentActivity} />
        </div>
      </div>
    </div>
  )
}
