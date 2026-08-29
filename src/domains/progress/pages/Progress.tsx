import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { useState } from 'react'
import { MetricBlock } from '@/shared/components/MetricBlock'
import { useSwipe } from '@/shared/hooks/useSwipe'
import { GamificationHeader } from '../components/GamificationHeader'
import { MilestonePath } from '../components/MilestonePath'
import { useGamificationProfile } from '../hooks/useGamificationProfile'
import { StreakTrackingSystem } from '../components/StreakTrackingSystem'
import { PersonalizedChallenges } from '../components/PersonalizedChallenges'
import { AchievementSystem } from '../components/AchievementSystem'
import { useProgressOverview } from '../hooks/useProgressOverview'

export default function Progress() {
  // La pestana inicial es «Logros» porque «Resumen» ya no existe: el sendero
  // de hitos y la cabecera de gamificacion son el resumen.
  const [activeTab, setActiveTab] = useState('achievements')
  const { overview } = useProgressOverview()
  const { profile, levelCompletion, experienceToNextLevel } = useGamificationProfile()

  /*
   * Deslizar entre pestanas. El orden vive aqui, junto a los `TabsTrigger`, para
   * que anadir una pestana no obligue a acordarse de tocar dos sitios.
   */
  const TAB_ORDER = ['achievements', 'challenges', 'streaks'] as const

  const moveTab = (offset: number) => {
    const current = TAB_ORDER.indexOf(activeTab as (typeof TAB_ORDER)[number])
    const next = current + offset
    // Sin envolver por los extremos: en la ultima pestana, deslizar hacia la
    // izquierda no debe devolver a la primera. Un carrusel circular en una
    // navegacion de tres desorienta mas de lo que ayuda.
    if (next < 0 || next >= TAB_ORDER.length) return
    setActiveTab(TAB_ORDER[next])
  }

  const { handlers: swipeHandlers } = useSwipe({
    onSwipeLeft: () => moveTab(1),
    onSwipeRight: () => moveTab(-1),
  })

  return (
    // Misma estructura de scroll que el resto de paginas: la cabecera queda
    // fija y solo desplaza <main>. Antes era un `space-y-6` suelto y la pagina
    // scrolleaba entera, cabecera incluida.
    <div className="flex flex-col flex-1 overflow-hidden bg-bone">
      {/* Sin `PageHeader`: en el registro de gamificacion la cabecera es la
          racha y el nivel, que el brief exige visibles siempre. Va `sticky`
          dentro del contenedor de desplazamiento, mas abajo. */}
      <header className="shrink-0 px-5 pt-6 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/45">
          Tu evolución
        </p>
        <h1 className="font-display text-4xl font-extrabold uppercase leading-none tracking-tight text-ink">
          Progreso
        </h1>
      </header>

      {/* Contenedor de scroll de la pagina. Es un div y no un <main> a
          proposito: el landmark <main> ya lo pinta SidebarInset desde
          RootLayout, y anidar uno dentro de otro es HTML invalido -solo se
          admite uno por documento- ademas de confundir a los lectores de
          pantalla. */}
      <div className="flex-1 overflow-auto">
        <GamificationHeader
          streak={profile.streak}
          level={profile.level}
          levelCompletion={levelCompletion}
          experienceToNextLevel={experienceToNextLevel}
        />

        <MilestonePath milestones={profile.milestones} />

        {/* Contadores en el registro sobrio, con reglas de 1 px en vez de
            tarjetas. Bajan de cinco a tres: «Rachas activas» lo dice ya la llama
            de la cabecera, y «Puntos totales» competia con la barra de XP como
            si fueran dos sistemas de puntos distintos. */}
        <div className="grid grid-cols-1 divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {overview.stats.map((stat) => (
            <MetricBlock
              key={stat.id}
              title={stat.label}
              indicator={stat.value}
              icon={stat.icon}
            />
          ))}
        </div>

        <div className="ps-4 pe-4 pb-4 pt-6 max-w-8xl mx-auto space-y-6">

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
            <Tabs value={activeTab} onValueChange={setActiveTab} {...swipeHandlers}>
              {/* Tres pestanas y no cinco. «Resumen» sobraba desde que existe el
                  sendero, y «Analisis» solo mostraba un cartel de «proximamente».
                  Con tres caben a 125 px cada una a 375 px, sin desplazamiento. */}
              <TabsList className="w-full md:grid md:grid-cols-3">
                <TabsTrigger value="achievements">Logros</TabsTrigger>
                <TabsTrigger value="challenges">Desafíos</TabsTrigger>
                <TabsTrigger value="streaks">Rachas</TabsTrigger>
              </TabsList>

              <TabsContent value="achievements" className="mt-6">
                <AchievementSystem />
              </TabsContent>

              <TabsContent value="challenges" className="mt-6">
                <PersonalizedChallenges />
              </TabsContent>

              <TabsContent value="streaks" className="mt-6">
                <StreakTrackingSystem />
              </TabsContent>

            </Tabs>
          </section>
        </div>
      </div>
    </div>
  )
}
