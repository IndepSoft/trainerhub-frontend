import { PageHeader } from '@/shared/components/PageHeader'
import IndicatorsList from '../components/organisms/IndicatorsList'
import UpcomingSessions from '../components/organisms/UpcomingSessions'
import RecentActivity from '../components/organisms/RecentActivity'

export default function Dashboard() {
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

      {/* <section className="page-content mt-8"> */}
      <main className="mt-8 flex-1 overflow-auto">
        <div className="ps-4 pe-4 pb-4 max-w-8xl mx-auto">
          <div className="space-y-6"></div>
          <div className="w-full mb-6">
            <IndicatorsList></IndicatorsList>
          </div>
          <div className="w-full flex gap-4">
            <UpcomingSessions></UpcomingSessions>
            <RecentActivity></RecentActivity>
          </div>
        </div>
      </main>
      {/* </section> */}
    </div>
  )
}
