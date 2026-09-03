import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { PageHeader } from '@/shared/components/PageHeader'
import { useSwipe } from '@/shared/hooks/useSwipe'
import { ExerciseCatalog } from '../components/ExerciseCatalog'
import { EquipmentCatalog } from '../components/EquipmentCatalog'
import { BlockLibrary } from '../components/BlockLibrary'
import { ReferenceCatalog } from '../components/ReferenceCatalog'
import { useTranslation } from '@/shared/i18n/LanguageContext'

const TAB_ORDER = ['ejercicios', 'equipamiento', 'bloques', 'referencia'] as const
type TabValue = (typeof TAB_ORDER)[number]

/**
 * El catálogo del entrenamiento. Sólo composición.
 *
 * Vive DENTRO de Entrenamientos, en `/trainings/catalog`, y no como destino
 * propio del menú: es el material con el que se componen rutinas, no una sección
 * hermana. Además la barra inferior de móvil ya está en su máximo de cinco
 * destinos, y el menú lateral declara dos rutas que ni siquiera existen; añadir
 * una octava entrada habría empeorado las dos cosas.
 *
 * Las pestañas están ordenadas por quién manda sobre el dato: ejercicios,
 * equipamiento y la biblioteca de bloques son del entrenador; la referencia es
 * vocabulario del sistema y no se edita.
 */
export default function TrainingCatalog() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabValue>('ejercicios')

  const moveTab = (offset: number) => {
    const next = TAB_ORDER.indexOf(activeTab) + offset
    if (next < 0 || next >= TAB_ORDER.length) return
    setActiveTab(TAB_ORDER[next])
  }

  const { handlers: swipeHandlers } = useSwipe({
    onSwipeLeft: () => moveTab(1),
    onSwipeRight: () => moveTab(-1),
  })

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      <PageHeader>
        <Link
          to="/trainings"
          className="-ms-2 mb-3 inline-flex h-11 items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/45 transition-colors hover:text-cobalt"
        >
          <ArrowLeft className="size-4" />
          {t('trainings.title')}
        </Link>

        <PageHeader.Eyebrow>{t('trainings.catalogEyebrow')}</PageHeader.Eyebrow>
        <PageHeader.Title>{t('trainings.catalog')}</PageHeader.Title>
      </PageHeader>

      <div className="flex-1 overflow-auto">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabValue)}
          {...swipeHandlers}
        >
          <div className="px-4 pt-1">
            <TabsList className="w-full md:grid md:grid-cols-4">
              <TabsTrigger value="ejercicios">{t('trainings.tab.exercises')}</TabsTrigger>
              <TabsTrigger value="equipamiento">{t('trainings.tab.equipment')}</TabsTrigger>
              <TabsTrigger value="bloques">{t('trainings.tab.blocks')}</TabsTrigger>
              <TabsTrigger value="referencia">{t('trainings.tab.reference')}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="ejercicios" className="mt-4">
            <ExerciseCatalog />
          </TabsContent>

          <TabsContent value="equipamiento" className="mt-4">
            <EquipmentCatalog />
          </TabsContent>

          <TabsContent value="bloques" className="mt-4">
            <BlockLibrary />
          </TabsContent>

          <TabsContent value="referencia" className="mt-4">
            <ReferenceCatalog />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
