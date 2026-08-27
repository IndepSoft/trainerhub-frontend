import type { IIndicatorCardProps } from '@/shared/components/card-custom/IndicatorCardComponent'
import IndicatorCardComponent from '@/shared/components/card-custom/IndicatorCardComponent'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import {
  BanknoteArrowUp,
  BicepsFlexed,
  CalendarDays,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import SummaryComponent from '../components/SummaryComponent'

/**
 * Indicadores de la cabecera de Reportes.
 *
 * A nivel de modulo a proposito: son estaticos, y dentro del componente se
 * recreaban en cada render, lo que obligaba a omitirlos de las dependencias del
 * useEffect y disparaba react-hooks/exhaustive-deps.
 *
 * TODO: valores de ejemplo. Deben venir del backend cuando exista el
 * repositorio de reportes.
 */
const indicatorsVal: IIndicatorCardProps[] = [
  {
    title: 'Alumnos Activos',
    indicator: 24,
    icon: Users,
    delta: 5,
    deltaType: 'up',
    period: 'month',
  },
  {
    title: 'Sesiones Completadas',
    indicator: 125,
    icon: CalendarDays,
    delta: 2,
    deltaType: 'up',
    period: 'week',
  },
  {
    title: 'Tasa de Asistencia',
    indicator: 87,
    icon: BanknoteArrowUp,
    sufix: '%',
    delta: 200,
    deltaType: 'up',
    period: 'month',
  },
  {
    title: 'Ingresos Totales',
    indicator: 4800,
    prefix: '$',
    icon: BicepsFlexed,
    delta: 4.8,
    deltaType: 'up',
    period: 'month',
  },
]

export default function Reports() {
  const [indicators, setIndicators] = useState<IIndicatorCardProps[]>([])
  const [activeTab, setActiveTab] = useState('summary')

  useEffect(() => {
    setIndicators(indicatorsVal)
  }, [])

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <PageHeader>
        <PageHeader.Content>
          <div>
            <PageHeader.Title>Reportes y Análisis</PageHeader.Title>
            <p className="text-sm text-gray-600 mt-1">
              Insights y métricas de tu negocio
            </p>
          </div>
        </PageHeader.Content>
      </PageHeader>

      {/* <section className="page-content mt-8"> */}
      <main className="mt-8 overflow-auto">
        <div className="ps-4 pe-4 pb-4 max-w-8xl mx-auto">
          <div className="space-y-6"></div>
          <div className="w-full mb-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {indicators.map((indicator, i) => (
                <IndicatorCardComponent
                  key={i}
                  title={indicator.title}
                  delta={indicator.delta}
                  deltaType={indicator.deltaType}
                  prefix={indicator.prefix}
                  sufix={indicator.sufix}
                  icon={indicator.icon}
                  indicator={indicator.indicator}
                  period={indicator.period}
                ></IndicatorCardComponent>
              ))}
            </div>
          </div>
          <div className="w-full flex gap-4"></div>
        </div>
      </main>
      <section className="w-full">
        <Card>
          <CardHeader>
            <CardTitle>Sistema de Gamificación</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="summary">Resumen</TabsTrigger>
                <TabsTrigger value="achievements">Logros</TabsTrigger>
                <TabsTrigger value="challenges">Desafíos</TabsTrigger>
                <TabsTrigger value="streaks">Rachas</TabsTrigger>
                <TabsTrigger value="analytics">Análisis</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="mt-6">
                <SummaryComponent></SummaryComponent>
              </TabsContent>

              <TabsContent value="achievements" className="mt-6">
                <div>page2 works</div>
              </TabsContent>

              <TabsContent value="challenges" className="mt-6">
                <div>page3 works</div>
              </TabsContent>

              <TabsContent value="streaks" className="mt-6">
                <div>page4 works</div>
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                <div>page5 works</div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
