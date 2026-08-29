import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { PageHeader } from '@/shared/components/PageHeader'
import { useSwipe } from '@/shared/hooks/useSwipe'
import { RoutineCard } from '../components/RoutineCard'
import { TrainingFilters } from '../components/TrainingFilters'
import { PersonalizedChallenges } from '../components/PersonalizedChallenges'
import { StreakTrackingSystem } from '../components/StreakTrackingSystem'
import { useRoutines } from '../hooks/useRoutines'
import type { Routine } from '../types/training.types'

/**
 * Orden de las pestañas, junto a los `TabsTrigger` para que añadir una no
 * obligue a acordarse de tocar dos sitios.
 */
const TAB_ORDER = ['rutinas', 'plantillas', 'desafios', 'rachas'] as const
type TabValue = (typeof TAB_ORDER)[number]

/**
 * Lo que el entrenador crea para asignar.
 *
 * Desafíos y rachas viven aquí y no en Progreso desde que se aclaró el flujo:
 * son cosas que el entrenador CREA para luego asignarlas a un estudiante, igual
 * que una rutina. En Progreso quedan los logros, que es lo que el estudiante
 * consigue.
 */
export default function Trainings() {
  const { routines, templates } = useRoutines()
  const [activeTab, setActiveTab] = useState<TabValue>('rutinas')

  const moveTab = (offset: number) => {
    const next = TAB_ORDER.indexOf(activeTab) + offset
    // Sin envolver por los extremos: en la ultima, deslizar a la izquierda no
    // debe devolver a la primera.
    if (next < 0 || next >= TAB_ORDER.length) return
    setActiveTab(TAB_ORDER[next])
  }

  const { handlers: swipeHandlers } = useSwipe({
    onSwipeLeft: () => moveTab(1),
    onSwipeRight: () => moveTab(-1),
  })

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-bone">
      <PageHeader>
        <PageHeader.Content>
          <div>
            <PageHeader.Eyebrow>Lo que asignas</PageHeader.Eyebrow>
            <PageHeader.Title>Entrenamientos</PageHeader.Title>
          </div>
          <PageHeader.Actions>
            {/* Una sola accion primaria. El boton «Plantillas» de antes
                duplicaba lo que ya hace su pestaña. */}
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Rutina
            </Button>
          </PageHeader.Actions>
        </PageHeader.Content>
      </PageHeader>

      <div className="flex-1 overflow-auto">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabValue)}
          {...swipeHandlers}
        >
          <div className="px-4 pt-1">
            <TabsList className="w-full md:grid md:grid-cols-4">
              {/* Los contadores salen del dato: antes estaban escritos a mano y
                  «Plantillas (1)» mentia, porque no habia ninguna. */}
              <TabsTrigger value="rutinas">Rutinas ({routines.length})</TabsTrigger>
              <TabsTrigger value="plantillas">Plantillas ({templates.length})</TabsTrigger>
              <TabsTrigger value="desafios">Desafíos</TabsTrigger>
              <TabsTrigger value="rachas">Rachas</TabsTrigger>
            </TabsList>
          </div>

          {/* Cada pestaña pinta lo suyo. Antes el control cambiaba de estado
              pero no habia `TabsContent`, asi que la lista era SIEMPRE la de
              rutinas propias y «Plantillas» no hacia nada. */}
          <TabsContent value="rutinas" className="mt-4">
            <RoutineList routines={routines} emptyLabel="Aún no has creado ninguna rutina." />
          </TabsContent>

          <TabsContent value="plantillas" className="mt-4">
            <RoutineList
              routines={templates}
              emptyLabel="No hay plantillas disponibles todavía."
            />
          </TabsContent>

          <TabsContent value="desafios" className="mt-4 px-4 pb-4">
            <PersonalizedChallenges />
          </TabsContent>

          <TabsContent value="rachas" className="mt-4 px-4 pb-4">
            <StreakTrackingSystem />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

interface RoutineListProps {
  routines: Routine[]
  emptyLabel: string
}

/**
 * Lista de rutinas con su fila de filtros.
 *
 * Los filtros sólo acompañan a las rutinas: filtrar por nivel o duración no
 * significa nada en desafíos ni en rachas, y dejarlos ahí sugeriría que hacen
 * algo.
 */
function RoutineList({ routines, emptyLabel }: RoutineListProps) {
  if (routines.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-ink/40">{emptyLabel}</p>
  }

  return (
    <>
      <div className="px-4 pb-4">
        <TrainingFilters />
      </div>
      {/* Rejilla y no <ul>: `RoutineCard` es un <article>, y `<ul><article>` es
          HTML invalido -los hijos de una lista tienen que ser <li>-. */}
      <div className="grid grid-cols-1 gap-4 px-4 pb-4 lg:grid-cols-2 xl:grid-cols-3">
        {routines.map((routine) => (
          <RoutineCard key={routine.id} routine={routine} />
        ))}
      </div>
    </>
  )
}
