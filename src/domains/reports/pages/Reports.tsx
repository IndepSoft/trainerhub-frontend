import { AlertTriangle, CalendarDays, UserMinus, Users } from 'lucide-react'
import { MetricBlock } from '@/shared/components/MetricBlock'
import { PageHeader } from '@/shared/components/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { useViewerContext } from '@/app/ViewerContext'
import { useDuesQueue } from '../hooks/useDuesQueue'
import { useRetention } from '../hooks/useRetention'
import { useCrewActivity } from '../hooks/useCrewActivity'
import { DuesQueue } from '../components/DuesQueue'
import { RetentionList } from '../components/RetentionList'
import { ActivityBreakdown } from '../components/ActivityBreakdown'
import { useTranslation } from '@/shared/i18n/LanguageContext'

/**
 * Reportes. Sólo composición.
 *
 * ESTABA ENTERAMENTE INVENTADO: 24 alumnos, 4.800 € de ingresos y un 87 % de
 * asistencia escritos a mano, más cuatro pestañas vacías bajo el rótulo «Sistema
 * de Gamificación» —que repetía lo que ya hace Progreso—. Ninguna cifra cambiaba
 * entrenando ni dejando de entrenar.
 *
 * TRES PESTAÑAS, Y CADA UNA RESPONDE A UNA PREGUNTA DE NEGOCIO. El criterio para
 * que algo esté aquí es que su respuesta cambie una decisión:
 *
 *   Cobros      ¿a quién tengo que llamar hoy?      → dinero que entra
 *   Retención   ¿quién está dejando de venir?       → dinero que se va
 *   Actividad   ¿cuánto se entrena, y cuándo?       → si cabe más gente
 *
 * Lo que se ha quitado no era poco útil, era decorativo: gráficas de ingresos
 * mensuales sin ninguna fuente de pagos, distribución de planes sin planes
 * asignados, y un botón de exportar que no exportaba.
 *
 * TODO: sigue sin haber importes. La cola dice QUIÉN vence y CUÁNDO, que es lo
 * que hace falta para cobrar; cuánto exige decidir moneda y modelo de tarifas, y
 * nada de eso está decidido. Ver `StudentSubscription`.
 */
export default function Reports() {
  const { t } = useTranslation()
  const { active } = useViewerContext()
  const { overdueCount, dueSoonCount, loading: loadingDues } = useDuesQueue()
  const { atRiskCount, entries } = useRetention()
  const { completedThisWeek } = useCrewActivity()

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-bone">
      <PageHeader className="pb-4">
        <PageHeader.Eyebrow>{active?.crew.name ?? t('reports.eyebrow')}</PageHeader.Eyebrow>
        <PageHeader.Title>{t('reports.title')}</PageHeader.Title>
      </PageHeader>

      {/* Contenedor de scroll de la pagina. Es un div y no un <main> a
          proposito: el landmark <main> ya lo pinta SidebarInset desde
          RootLayout, y anidar uno dentro de otro es HTML invalido -solo se
          admite uno por documento- ademas de confundir a los lectores de
          pantalla. */}
      <div className="flex-1 overflow-auto">
        {/*
          Cuatro cifras, y las tres primeras son cosas que hay que atender hoy.
          Sin tendencias: comparar con el periodo anterior exige un historico que
          no hay, y `MetricBlock` ya sabe omitir esa linea —«en vez de pintar un
          cero engañoso», dice su propio comentario—.
        */}
        <div className="grid grid-cols-1 divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3 sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
          <MetricBlock
            title={t('reports.metric.overdue')}
            indicator={overdueCount}
            icon={AlertTriangle}
          />
          <MetricBlock
            title={t('reports.metric.dueSoon')}
            indicator={dueSoonCount}
            icon={CalendarDays}
          />
          <MetricBlock title={t('reports.metric.atRisk')} indicator={atRiskCount} icon={UserMinus} />
          <MetricBlock title={t('reports.metric.students')} indicator={entries.length} icon={Users} />
        </div>

        <div className="mx-auto max-w-4xl px-5 py-6">
          <Tabs defaultValue="cobros">
            {/* Tres columnas y no `inline-flex`: a 375 px, tres pestañas en
                linea dejaban la ultima cortada contra el borde. */}
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cobros">{t('reports.tab.dues')}</TabsTrigger>
              <TabsTrigger value="retencion">{t('reports.tab.retention')}</TabsTrigger>
              <TabsTrigger value="actividad">{t('reports.tab.activity')}</TabsTrigger>
            </TabsList>

            <TabsContent value="cobros" className="mt-6 space-y-3">
              <p className="text-sm text-ink/55">
                {loadingDues ? t('common.loading') : t('reports.dues.hint')}
              </p>
              <DuesQueue />
            </TabsContent>

            <TabsContent value="retencion" className="mt-6 space-y-3">
              <p className="text-sm text-ink/55">
                {t('reports.retention.hint')}
              </p>
              <RetentionList />
            </TabsContent>

            <TabsContent value="actividad" className="mt-6 space-y-3">
              <p className="text-sm text-ink/55">
                {t('reports.activity.hint', { count: completedThisWeek })}
              </p>
              <ActivityBreakdown />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
