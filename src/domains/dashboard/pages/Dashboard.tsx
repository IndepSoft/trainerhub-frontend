import { PageHeader } from '@/shared/components/PageHeader'
import { IndicatorList } from '../components/IndicatorList'
import { UpcomingSessionsCard } from '../components/UpcomingSessionsCard'
import { RecentActivityCard } from '../components/RecentActivityCard'
import { useDashboardSummary } from '../hooks/useDashboardSummary'

export default function Dashboard() {
  const { summary } = useDashboardSummary()

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <PageHeader>
        <PageHeader.Content>
          <div>
            <PageHeader.Title>Dashboard</PageHeader.Title>
            <p className="text-sm text-gray-600 mt-1">
              Resumen de tu actividad como entrenador
            </p>
          </div>
        </PageHeader.Content>
      </PageHeader>

      <main className="mt-8 flex-1 overflow-auto">
        <div className="ps-4 pe-4 pb-4 max-w-8xl mx-auto">
          <div className="w-full mb-6">
            <IndicatorList indicators={summary.indicators} />
          </div>
          <div className="w-full flex gap-4">
            <UpcomingSessionsCard sessions={summary.upcomingSessions} />
            <RecentActivityCard activities={summary.recentActivity} />
          </div>
        </div>
      </main>
    </div>
  )
}
