import { useEffect, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { MetricBlock } from '@/shared/components/MetricBlock'
import { MetricStrip } from '@/shared/components/MetricStrip'
import { closesRowAlone } from '@/shared/lib/metricRows'
import { PageHeader } from '@/shared/components/PageHeader'
import { GamificationHeader } from '../components/GamificationHeader'
import { RoutePath } from '../components/RoutePath'
import { AchievementSystem } from '../components/AchievementSystem'
import { JoinCrewPrompt } from '../components/JoinCrewPrompt'
import { AssignedRepertoire } from '../components/AssignedRepertoire'
import { SessionHistory } from '../components/SessionHistory'
import { useGamificationProfile } from '../hooks/useGamificationProfile'
import { useProgressOverview } from '../hooks/useProgressOverview'
import { useViewerContext } from '@/app/ViewerContext'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { PAGE_SCROLL } from '@/shared/lib/pageScroll'
import { useSwipe } from '@/shared/hooks/useSwipe'
import { useUrlSection } from '@/shared/hooks/useUrlSection'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'

/** Las secciones del progreso, en el orden en que se miran. */
const PROGRESS_SECTIONS = ['ruta', 'logros', 'historial'] as const
type ProgressSection = (typeof PROGRESS_SECTIONS)[number]

const PROGRESS_SECTION_LABEL_KEY: Record<ProgressSection, TranslationKey> = {
  ruta: 'progress.routeSection',
  // «Logros» y no «Insignias», que es como lo rotula el artboard: la galería,
  // el filtro y el vacío llevan diciendo «logros» desde el catálogo, y dos
  // palabras para una misma cosa en la misma pantalla se leen como dos cosas.
  logros: 'progress.achievements',
  historial: 'progress.historySection',
}

/**
 * El progreso de quien lo mira. Sólo composición.
 *
 * ES DE UNO MISMO Y DE NADIE MÁS. Tuvo un selector de alumno para que el
 * entrenador eligiera a quién mirar, y eso convertía la pantalla en un módulo
 * aparte al que había que ir y buscar a la persona. El progreso de un alumno es
 * un dato SUYO: pertenece a su tarjeta y a su ficha, que es donde el entrenador
 * ya está mirando cuando se lo pregunta.
 *
 * Quien no entrena aquí no llega: la navegación no le ofrece el destino
 * —`onlyIfTrainsHere`— y si escribe la dirección se encuentra la invitación a
 * unirse, que es lo que le corresponde.
 */
export default function Progress() {
  const { t } = useTranslation()
  const { active, loading } = useViewerContext()
  const student = active?.student ?? null
  const scrollerRef = useRef<HTMLDivElement>(null)

  const {
    profile,
    route,
    path,
    wildcards,
    canCoverYesterday,
    coverYesterday,
    achievements,
    history,
    totalPoints,
    levelCompletion,
    experienceToNextLevel,
  } = useGamificationProfile(student?.id, student?.birthDate ?? null)
  const { overview } = useProgressOverview(achievements, totalPoints)

  const { section, select: selectSection } = useUrlSection(PROGRESS_SECTIONS)

  const moveSection = (delta: number) => {
    const next = PROGRESS_SECTIONS.indexOf(section) + delta
    if (next < 0 || next >= PROGRESS_SECTIONS.length) return
    selectSection(PROGRESS_SECTIONS[next])
  }

  const { handlers: swipeHandlers } = useSwipe({
    onSwipeLeft: () => moveSection(1),
    onSwipeRight: () => moveSection(-1),
  })

  // Cada sección empieza por arriba: el contenedor que desplaza es el mismo
  // para las tres, y sin esto el historial se abría a la altura de la ruta.
  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: 0 })
  }, [section])

  return (
    // La cabecera, el registro y las pestañas quedan fijos; sólo desplaza la
    // sección abierta.
    <div className="flex flex-col flex-1 overflow-hidden bg-bone">
      {/* La cabecera de verdad de esta seccion es la racha y el nivel, que el
          brief exige visibles siempre. Esta solo nombra la pagina. */}
      <PageHeader className="md:pb-4">
        <PageHeader.Eyebrow>{t('progress.eyebrow')}</PageHeader.Eyebrow>
        <PageHeader.Title>{t('progress.title')}</PageHeader.Title>
      </PageHeader>

      {/*
        SIN EQUIPO SE PINTA TODO, A CERO.
        Es la decision de producto: el alumno navega, ve el registro entero
        -nivel, racha, sendero- vacio, y todo le empuja a unirse. Cortarle el
        paso con una pantalla unica seria mas simple y explicaria menos.
      */}
      {!loading && student === null && <JoinCrewPrompt />}

      {/* FUERA DEL CONTENEDOR QUE DESPLAZA, y antes iba dentro pegado con
          `sticky`: el nivel y la racha no se pierden de vista al recorrer una
          sección, y cambiar de sección no los mueve. */}
      <GamificationHeader
        streak={profile.streak}
        level={profile.level}
        levelCompletion={levelCompletion}
        experienceToNextLevel={experienceToNextLevel}
        wildcards={wildcards}
        canCoverYesterday={canCoverYesterday}
        onCoverYesterday={() => void coverYesterday()}
      />

      <Tabs
        value={section}
        onValueChange={(value) => {
          const chosen = PROGRESS_SECTIONS.find((candidate) => candidate === value)
          if (chosen !== undefined) selectSection(chosen)
        }}
        className="min-h-0 flex-1 gap-0"
      >
        <div className="shrink-0 px-5 py-3">
          <TabsList aria-label={t('progress.sectionsLabel')} className="w-full md:max-w-md">
            {PROGRESS_SECTIONS.map((candidate) => (
              <TabsTrigger key={candidate} value={candidate} className="px-2 text-[13px] font-semibold">
                {t(PROGRESS_SECTION_LABEL_KEY[candidate])}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Contenedor de scroll de la pagina. Es un div y no un <main> a
            proposito: el landmark <main> ya lo pinta SidebarInset desde
            RootLayout, y anidar uno dentro de otro es HTML invalido -solo se
            admite uno por documento- ademas de confundir a los lectores de
            pantalla. */}
        <div ref={scrollerRef} className={PAGE_SCROLL} {...swipeHandlers}>
          <TabsContent value="ruta" className="pb-6">
            <RoutePath route={route} nodes={path} />

            {/* Lo que le han asignado: la base ya se lo dejaba leer y ninguna
                pantalla lo pintaba. Sin ficha no hay repertorio. */}
            {student !== null && <AssignedRepertoire studentId={student.id} />}

            {/* Contadores en el registro sobrio, con reglas de 1 px en vez de
                tarjetas. Los dos salen de sesiones reales: antes eran tres
                cifras escritas a mano —12 logros, 5 desafios, 87 % de
                participacion— que no cambiaban nunca. */}
            <MetricStrip columns={2} className="mt-8">
              {overview.stats.map((stat, index) => (
                <MetricBlock
                  key={stat.id}
                  title={stat.label}
                  indicator={stat.value}
                  icon={stat.icon}
                  mobileLayout={closesRowAlone(index, overview.stats.length) ? 'wide' : 'stacked'}
                />
              ))}
            </MetricStrip>
          </TabsContent>

          <TabsContent value="logros" className="mx-auto max-w-3xl px-5 pb-6">
            {/* Sin envoltura <Card>, por el mismo motivo que en Reportes: su
                contenido son a su vez tarjetas, que pagaban el relleno dos veces
                y caian a 277 px, bajo el minimo util de 280 de la regla 1.6. */}
            <AchievementSystem achievements={achievements} />
          </TabsContent>

          <TabsContent value="historial" className="mx-auto max-w-3xl px-5 pb-6">
            <SessionHistory entries={history} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
