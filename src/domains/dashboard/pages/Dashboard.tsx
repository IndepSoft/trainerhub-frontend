import { IndicatorList } from '../components/IndicatorList'
import { UpcomingSessions } from '../components/UpcomingSessions'
import { RecentActivity } from '../components/RecentActivity'
import { useDashboardSummary } from '../hooks/useDashboardSummary'
import { usePullToRefresh } from '@/shared/hooks/usePullToRefresh'
import { PullToRefreshIndicator } from '@/shared/components/PullToRefreshIndicator'

export default function Dashboard() {
  const { summary, refresh } = useDashboardSummary()
  const { pullDistance, isRefreshing, willRefresh, handlers } = usePullToRefresh({
    onRefresh: refresh,
  })

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      {/* Cabecera propia y no `PageHeader`: el registro sobrio quiere el titulo
          en Condensed y una regla, no la caja blanca con borde inferior que
          usan las demas paginas. Se unificara cuando les toque el rediseno. */}
      <header className="shrink-0 px-5 pt-6 pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/45">
          Tu actividad
        </p>
        <h1 className="font-display text-4xl font-extrabold uppercase leading-none tracking-tight text-ink">
          Dashboard
        </h1>
      </header>

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
