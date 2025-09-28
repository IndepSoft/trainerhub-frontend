import { PageHeader } from '@/shared/components/PageHeader'
import IndicatorsList from '../components/organisms/IndicatorsList'
import UpcomingSessions from '../components/organisms/UpcomingSessions'
import RecentActivity from '../components/organisms/RecentActivity'

export default function Dashboard() {
  return (
    <div className="students-page">
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

      <section className="page-content mt-8">
        <div className="w-full mb-6">
          <IndicatorsList></IndicatorsList>
        </div>
        <div className="w-full flex gap-4">
          <UpcomingSessions></UpcomingSessions>
          <RecentActivity></RecentActivity>
        </div>
      </section>
    </div>
  )
}
