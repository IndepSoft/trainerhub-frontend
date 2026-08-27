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

export default function Reports() {
  const [indicators, setIndicators] = useState<IIndicatorCardProps[]>([])
  const [activeTab, setActiveTab] = useState('summary')

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
  const revenueData = {
    labels: [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ],
    datasets: [
      {
        label: 'Ingresos',
        data: [
          2800, 3200, 3500, 3800, 4200, 4500, 4800, 5000, 4700, 4900, 5200,
          5400,
        ],
        fill: true,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderColor: 'rgb(99, 102, 241)',
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
      },
    ],
  }

  const planDistribution = {
    labels: ['Plan Mensual', 'Plan Semestral', 'Paquetes'],
    datasets: [
      {
        data: [45, 35, 20],
        backgroundColor: [
          'rgb(99, 102, 241)',
          'rgb(249, 115, 22)',
          'rgb(34, 197, 94)',
        ],
        borderWidth: 0,
      },
    ],
  }

  const attendanceData = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Asistencia',
        data: [85, 92, 78, 88, 95, 72, 65],
        backgroundColor: 'rgb(99, 102, 241)',
        borderRadius: 6,
      },
    ],
  }

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
            <div className="flex gap-4">
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
