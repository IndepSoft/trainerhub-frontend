import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { TrendingUp } from 'lucide-react'
import { PageHeader } from '@/shared/components/PageHeader'
import { useState } from 'react'
import { StatCard } from '../components/StatCard'
import { ProgressOverviewPanel } from '../components/ProgressOverviewPanel'
import { StreakTrackingSystem } from '../components/StreakTrackingSystem'
import { PersonalizedChallenges } from '../components/PersonalizedChallenges'
import { AchievementSystem } from '../components/AchievementSystem'
import { useProgressOverview } from '../hooks/useProgressOverview'

export default function Progress() {
  const [activeTab, setActiveTab] = useState('overview')
  const { overview } = useProgressOverview()

  return (
    // Misma estructura de scroll que el resto de paginas: la cabecera queda
    // fija y solo desplaza <main>. Antes era un `space-y-6` suelto y la pagina
    // scrolleaba entera, cabecera incluida.
    <div className="flex flex-col flex-1 overflow-hidden">
      <PageHeader>
        <PageHeader.Content>
          <div>
            <PageHeader.Title>Progreso</PageHeader.Title>
            <p className="text-sm text-gray-600 mt-1">
              Logros, desafíos y rachas de tus estudiantes
            </p>
          </div>
        </PageHeader.Content>
      </PageHeader>

      {/* Contenedor de scroll de la pagina. Es un div y no un <main> a
          proposito: el landmark <main> ya lo pinta SidebarInset desde
          RootLayout, y anidar uno dentro de otro es HTML invalido -solo se
          admite uno por documento- ademas de confundir a los lectores de
          pantalla. */}
      <div className="flex-1 overflow-auto">
        <div className="ps-4 pe-4 pb-4 pt-4 max-w-8xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {overview.stats.map((stat) => (
              <StatCard
                key={stat.id}
                icon={stat.icon}
                color={stat.color}
                label={stat.label}
                value={stat.value}
              />
            ))}
          </div>

          {/* Sin envoltura <Card>, por el mismo motivo que en Reportes: su
              contenido son a su vez tarjetas, que pagaban el relleno dos veces y
              caian a 277 px, bajo el minimo util de 280 de la regla 1.6. Un
              <h2> da la misma informacion sin ese nivel, y ademas es un
              encabezado de verdad para un lector de pantalla: CardTitle
              renderiza un <div>. */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold leading-none tracking-tight">
              Seguimiento de Progreso
            </h2>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full md:grid md:grid-cols-5">
                <TabsTrigger value="overview">Resumen</TabsTrigger>
                <TabsTrigger value="achievements">Logros</TabsTrigger>
                <TabsTrigger value="challenges">Desafíos</TabsTrigger>
                <TabsTrigger value="streaks">Rachas</TabsTrigger>
                <TabsTrigger value="analytics">Análisis</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <ProgressOverviewPanel
                  overview={overview}
                  onNavigateToTab={setActiveTab}
                />
              </TabsContent>

              <TabsContent value="achievements" className="mt-6">
                <AchievementSystem />
              </TabsContent>

              <TabsContent value="challenges" className="mt-6">
                <PersonalizedChallenges />
              </TabsContent>

              <TabsContent value="streaks" className="mt-6">
                <StreakTrackingSystem />
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Análisis Avanzado de Progreso
                  </h3>
                  <p className="text-muted-foreground">
                    Métricas detalladas, reportes de participación y análisis de
                    efectividad estarán disponibles próximamente.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </div>
    </div>
  )
}
