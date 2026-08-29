import { IndicatorList } from '../components/IndicatorList'
import { UpcomingSessions } from '../components/UpcomingSessions'
import { RecentActivity } from '../components/RecentActivity'
import { useDashboardSummary } from '../hooks/useDashboardSummary'
import { usePullToRefresh } from '@/shared/hooks/usePullToRefresh'
import { PullToRefreshIndicator } from '@/shared/components/PullToRefreshIndicator'
import { PageHeader } from '@/shared/components/PageHeader'

export default function Dashboard() {
  const { summary, refresh } = useDashboardSummary()
  const { pullDistance, isRefreshing, willRefresh, handlers } = usePullToRefresh({
    onRefresh: refresh,
  })

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      <PageHeader>
        <PageHeader.Eyebrow>Tu actividad</PageHeader.Eyebrow>
        <PageHeader.Title>Dashboard</PageHeader.Title>
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

        <div className="flex flex-col gap-10 px-5 py-8 lg:flex-row lg:gap-12">
          <UpcomingSessions sessions={summary.upcomingSessions} />
          <RecentActivity activities={summary.recentActivity} />
        </div>
      </div>
    </div>
  )
}
