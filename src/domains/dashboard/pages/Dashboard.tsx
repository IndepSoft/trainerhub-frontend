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
import { PAGE_SCROLL } from '@/shared/lib/pageScroll'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { useUrlSection } from '@/shared/hooks/useUrlSection'
import { useWideViewport } from '@/shared/hooks/useWideViewport'

/**
 * Las dos listas que se miran, en el orden en que importan: lo que viene antes
 * que lo que ya pasó. Sólo existen como secciones en el teléfono.
 */
const PANEL_SECTIONS = ['proximas', 'actividad'] as const

export default function Dashboard() {
  const { t } = useTranslation()
  const isWide = useWideViewport()
  const { section, select: selectSection } = useUrlSection(PANEL_SECTIONS)
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
      <div className={PAGE_SCROLL} {...handlers}>
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

          {/*
            LAS DOS LISTAS QUE SE MIRAN, UNA A LA VEZ EN EL TELÉFONO. Apiladas
            eran el grueso de los 1.157 px que el panel desplazaba: dos líneas
            de tiempo seguidas, y la segunda —lo que YA pasó— siempre por
            debajo del pliegue. Ninguna de las dos pide una decisión, así que
            se eligen; la bandeja, que sí la pide, se queda arriba.

            En ancho no hay nada que elegir: caben lado a lado, como estaban.
          */}
          {isWide ? (
            <>
              <UpcomingSessions sessions={summary.upcomingSessions} />
              <RecentActivity activities={summary.recentActivity} />
            </>
          ) : (
            <Tabs
              value={section}
              onValueChange={(value) => {
                const chosen = PANEL_SECTIONS.find((candidate) => candidate === value)
                if (chosen !== undefined) selectSection(chosen)
              }}
              className="gap-0"
            >
              <TabsList aria-label={t('dashboard.sectionsLabel')} className="w-full">
                <TabsTrigger value="proximas" className="gap-1.5 px-2 text-[13px] font-semibold">
                  {t('dashboard.upcoming')}
                  {summary.upcomingSessions.length > 0 && (
                    <span className="metric-figures text-cobalt">
                      {summary.upcomingSessions.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="actividad" className="px-2 text-[13px] font-semibold">
                  {t('dashboard.recentActivity')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="proximas">
                <UpcomingSessions sessions={summary.upcomingSessions} withHeading={false} />
              </TabsContent>

              <TabsContent value="actividad">
                <RecentActivity activities={summary.recentActivity} withHeading={false} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  )
}
