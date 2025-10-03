import { useState } from 'react'
import {
  Search,
  Filter,
  Copy,
  Plus,
  Clock,
  Dumbbell,
  MoreVertical,
  Play,
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { PageHeader } from '@/shared/components/PageHeader'
import { InputWithIcon } from '@/shared/components/InputWithIcon'

export default function Trainings() {
  const [activeTab, setActiveTab] = useState('mis-rutinas')
  // const [searchQuery, setSearchQuery] = useState('')

  const routines = [
    {
      id: 1,
      title: 'Rutina Principiante - Cuerpo Completo',
      description: 'Rutina ideal para comenzar con ejercicios básicos',
      exercises: 3,
      duration: 45,
      level: 'Principiante',
      levelColor: 'bg-orange-500',
      details: [
        { name: 'Sentadillas', reps: '3x12' },
        { name: 'Flexiones', reps: '3x8' },
        { name: 'Plancha', reps: '3x30 seg' },
      ],
    },
  ]

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <PageHeader>
        <PageHeader.Content>
          <div>
            <PageHeader.Title>Rutinas y Entrenamientos</PageHeader.Title>
            <p className="text-sm text-gray-600 mt-1">
              Crea, gestiona y asigna rutinas personalizadas para tus
              estudiantes
            </p>
          </div>
          <PageHeader.Actions>
            <Button variant="outline" className="gap-2">
              <Copy className="h-4 w-4" />
              Plantillas
            </Button>
            <Button className="gap-2 bg-blue-900 hover:bg-blue-800">
              <Plus className="h-4 w-4" />
              Nueva Rutina
            </Button>
          </PageHeader.Actions>
        </PageHeader.Content>
      </PageHeader>

      <section className="pt-4 ps-4 pe-4 mb-6 space-y-6">
        {/* Search and Filters */}
        <div className="flex items-center gap-4 justify-between">
          <div className="max-w-sm w-full">
            <InputWithIcon
              icon={<Search className="w-4 h-4" />}
              iconPosition="left"
              placeholder="Buscar rutinas..."
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="mis-rutinas">Mis Rutinas (1)</TabsTrigger>
            <TabsTrigger value="plantillas">Plantillas (1)</TabsTrigger>
          </TabsList>
        </Tabs>
      </section>

      {/* Routine Cards */}
      <main className="flex-1 overflow-auto">
        <div className="ps-4 pe-4 pb-4 max-w-8xl mx-auto">
          <div className="grid gap-6">
            {routines.map((routine) => (
              <Card
                key={routine.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-xl">{routine.title}</CardTitle>
                      <CardDescription>{routine.description}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Duplicar</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4" />
                      <span>{routine.exercises} ejercicios</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{routine.duration} min</span>
                    </div>
                    <Badge
                      className={`${routine.levelColor} text-white hover:${routine.levelColor}`}
                    >
                      {routine.level}
                    </Badge>
                  </div>

                  {/* Level Badge */}
                  <div>
                    <Badge variant="outline" className="text-xs">
                      {routine.level}
                    </Badge>
                  </div>

                  {/* Exercise Details */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3">
                      Ejercicios principales:
                    </h4>
                    <div className="space-y-2">
                      {routine.details.map((exercise, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="text-gray-700">{exercise.name}</span>
                          <span className="text-gray-500">{exercise.reps}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1 gap-2">
                      <Copy className="h-4 w-4" />
                      Usar
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2">
                      <Play className="h-4 w-4" />
                      Vista previa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
