import { useState } from 'react'
import { Copy, Plus } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { PageHeader } from '@/shared/components/PageHeader'
import { RoutineCard } from '../components/RoutineCard'
import { TrainingFilters } from '../components/TrainingFilters'
import { useRoutines } from '../hooks/useRoutines'

export default function Trainings() {
  const { routines, templates } = useRoutines()
  // TODO: las pestañas cambian de estado pero no de contenido: no hay
  // TabsContent, asi que la lista es siempre la de rutinas propias.
  const [activeTab, setActiveTab] = useState('mis-rutinas')

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-bone">
      <PageHeader>
        <PageHeader.Content>
          <div>
            <PageHeader.Eyebrow>Lo que asignas</PageHeader.Eyebrow>
            <PageHeader.Title>Rutinas</PageHeader.Title>
          </div>
          <PageHeader.Actions>
            <Button variant="outline" className="gap-2">
              <Copy className="h-4 w-4" />
              Plantillas
            </Button>
            {/* Cobalt, como el primario del resto de paginas. Venia de un
                `bg-blue-900` escrito a mano que el barrido de color convirtio en
                Ink: una accion primaria en negro mientras la de estudiantes iba
                en azul. */}
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Rutina
            </Button>
          </PageHeader.Actions>
        </PageHeader.Content>
      </PageHeader>

      <section className="pt-4 ps-4 pe-4 mb-6 space-y-6">
        <TrainingFilters />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {/* Los contadores salen del dato: antes estaban escritos a mano y
                "Plantillas (1)" mentia, porque no habia ninguna. */}
            <TabsTrigger value="mis-rutinas">
              Mis Rutinas ({routines.length})
            </TabsTrigger>
            <TabsTrigger value="plantillas">
              Plantillas ({templates.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </section>

      {/* Contenedor de scroll de la pagina. Es un div y no un <main> a
          proposito: el landmark <main> ya lo pinta SidebarInset desde
          RootLayout, y anidar uno dentro de otro es HTML invalido -solo se
          admite uno por documento- ademas de confundir a los lectores de
          pantalla. */}
      <div className="flex-1 overflow-auto">
        <div className="ps-4 pe-4 pb-4 max-w-8xl mx-auto">
          <div className="grid gap-6">
            {routines.map((routine) => (
              <RoutineCard key={routine.id} routine={routine} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
