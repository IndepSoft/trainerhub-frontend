import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { PageHeader } from '@/shared/components/PageHeader'
import { useSwipe } from '@/shared/hooks/useSwipe'
import { useUrlSection } from '@/shared/hooks/useUrlSection'
import { ExerciseCatalog } from '../components/ExerciseCatalog'
import { EquipmentCatalog } from '../components/EquipmentCatalog'
import { BlockLibrary } from '../components/BlockLibrary'
import { ReferenceCatalog } from '../components/ReferenceCatalog'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { PAGE_SCROLL } from '@/shared/lib/pageScroll'

const CATALOG_SECTIONS = ['ejercicios', 'equipamiento', 'bloques', 'referencia'] as const

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
  const scrollerRef = useRef<HTMLDivElement>(null)

  /*
   * La sección en la dirección, como en el resto (`CAMBIOS` §45). De paso se
   * lleva el `as` con el que se estrechaba el valor del control: ahora lo
   * estrecha la lista.
   */
  const { section, select: selectSection } = useUrlSection(CATALOG_SECTIONS)

  const moveSection = (offset: number) => {
    const next = CATALOG_SECTIONS.indexOf(section) + offset
    if (next < 0 || next >= CATALOG_SECTIONS.length) return
    selectSection(CATALOG_SECTIONS[next])
  }

  const { handlers: swipeHandlers } = useSwipe({
    onSwipeLeft: () => moveSection(1),
    onSwipeRight: () => moveSection(-1),
  })

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: 0 })
  }, [section])

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      <PageHeader>
        <Link
          to="/trainings"
          className="-ms-2 mb-3 inline-flex h-11 items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60 transition-colors hover:text-cobalt"
        >
          <ArrowLeft className="size-4" />
          {t('trainings.title')}
        </Link>

        <PageHeader.Eyebrow>{t('trainings.catalogEyebrow')}</PageHeader.Eyebrow>
        <PageHeader.Title>{t('trainings.catalog')}</PageHeader.Title>
      </PageHeader>

      <Tabs
        value={section}
        onValueChange={(value) => {
          const chosen = CATALOG_SECTIONS.find((candidate) => candidate === value)
          if (chosen !== undefined) selectSection(chosen)
        }}
        className="min-h-0 flex-1 gap-0"
      >
        <div className="shrink-0 px-5 pb-3">
          <TabsList aria-label={t('trainings.catalogSectionsLabel')} className="w-full md:max-w-xl">
            <TabsTrigger value="ejercicios" className="px-2 text-[13px] font-semibold">
              {t('trainings.tab.exercises')}
            </TabsTrigger>
            <TabsTrigger value="equipamiento" className="px-2 text-[13px] font-semibold">
              {t('trainings.tab.equipment')}
            </TabsTrigger>
            <TabsTrigger value="bloques" className="px-2 text-[13px] font-semibold">
              {t('trainings.tab.blocks')}
            </TabsTrigger>
            <TabsTrigger value="referencia" className="px-2 text-[13px] font-semibold">
              {t('trainings.tab.reference')}
            </TabsTrigger>
          </TabsList>
        </div>

        <div ref={scrollerRef} className={PAGE_SCROLL} {...swipeHandlers}>
          <TabsContent value="ejercicios">
            <ExerciseCatalog />
          </TabsContent>

          <TabsContent value="equipamiento">
            <EquipmentCatalog />
          </TabsContent>

          <TabsContent value="bloques">
            <BlockLibrary />
          </TabsContent>

          <TabsContent value="referencia">
            <ReferenceCatalog />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
