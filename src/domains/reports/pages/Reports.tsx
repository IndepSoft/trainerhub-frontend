import {
  IndicatorCard,
  type IndicatorCardProps,
} from '@/shared/components/IndicatorCard'
import { PageHeader } from '@/shared/components/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import {
  BanknoteArrowUp,
  BicepsFlexed,
  CalendarDays,
  Users,
} from 'lucide-react'
import { useState } from 'react'
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
const indicatorsVal: IndicatorCardProps[] = [
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
    suffix: '%',
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
  const [activeTab, setActiveTab] = useState('summary')

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

      {/* Contenedor de scroll de la pagina. Es un div y no un <main> a
          proposito: el landmark <main> ya lo pinta SidebarInset desde
          RootLayout, y anidar uno dentro de otro es HTML invalido -solo se
          admite uno por documento- ademas de confundir a los lectores de
          pantalla. */}
      <div className="mt-8 flex-1 overflow-auto">
        <div className="ps-4 pe-4 pb-4 max-w-8xl mx-auto space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {indicatorsVal.map((indicator) => (
              <IndicatorCard
                key={indicator.title}
                title={indicator.title}
                delta={indicator.delta}
                deltaType={indicator.deltaType}
                prefix={indicator.prefix}
                suffix={indicator.suffix}
                icon={indicator.icon}
                indicator={indicator.indicator}
                period={indicator.period}
              />
            ))}
          </div>

          {/* Sin envoltura <Card>. La tenia, y como su contenido son a su vez
              tarjetas, cada una pagaba el relleno dos veces y caia a 277 px, por
              debajo del minimo util de 280 que fija la regla 1.6. Un encabezado
              suelto da la misma informacion sin anadir un nivel de anidamiento
              -y <h2> si es un encabezado para un lector de pantalla, cosa que
              CardTitle no es: renderiza un <div>. */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold leading-none tracking-tight">
              Sistema de Gamificación
            </h2>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full md:grid md:grid-cols-5">
                <TabsTrigger value="summary">Resumen</TabsTrigger>
                <TabsTrigger value="achievements">Logros</TabsTrigger>
                <TabsTrigger value="challenges">Desafíos</TabsTrigger>
                <TabsTrigger value="streaks">Rachas</TabsTrigger>
                <TabsTrigger value="analytics">Análisis</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="mt-6">
                <SummaryComponent />
              </TabsContent>

              {/* TODO: cuatro pestanas sin contenido. Heredaron el andamiaje
                  «pageN works» del generador y nunca se completaron. Falta
                  decidir en producto que muestra cada una: hoy repiten las
                  mismas cinco solapas que /progress, asi que puede que
                  sobren aqui en vez de tener que rellenarse. */}
              <TabsContent value="achievements" className="mt-6">
                <EmptyTabNotice />
              </TabsContent>

              <TabsContent value="challenges" className="mt-6">
                <EmptyTabNotice />
              </TabsContent>

              <TabsContent value="streaks" className="mt-6">
                <EmptyTabNotice />
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                <EmptyTabNotice />
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </div>
    </div>
  )
}

/**
 * Marcador para las pestanas de Reportes que aun no tienen contenido definido.
 * Existe para que la interfaz diga la verdad -«no hay nada aqui todavia»- en
 * vez de mostrar el «pageN works» del andamiaje, que un usuario lee como un
 * fallo.
 */
function EmptyTabNotice() {
  return (
    <p className="text-sm text-muted-foreground py-8 text-center">
      Esta sección todavía no tiene contenido.
    </p>
  )
}
