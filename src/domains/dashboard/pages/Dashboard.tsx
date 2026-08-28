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

      {/* Contenedor de scroll de la pagina. Es un div y no un <main> a
          proposito: el landmark <main> ya lo pinta SidebarInset desde
          RootLayout, y anidar uno dentro de otro es HTML invalido -solo se
          admite uno por documento- ademas de confundir a los lectores de
          pantalla. */}
      <div className="mt-8 flex-1 overflow-auto">
        <div className="ps-4 pe-4 pb-4 max-w-8xl mx-auto">
          <div className="w-full mb-6">
            <IndicatorList indicators={summary.indicators} />
          </div>
          <div className="flex w-full flex-col gap-4 lg:flex-row">
            <UpcomingSessionsCard sessions={summary.upcomingSessions} />
            <RecentActivityCard activities={summary.recentActivity} />
          </div>
        </div>
      </div>
    </div>
  )
}
