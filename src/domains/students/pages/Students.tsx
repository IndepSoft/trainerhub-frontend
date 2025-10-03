import { InputWithIcon } from '@/shared/components/InputWithIcon'
import { PageHeader } from '@/shared/components/PageHeader'
import { Button } from '@/shared/ui/button'
import { Filter, Plus, Search, UserPlus } from 'lucide-react'
import { StudentCard } from '../components/StudentCard'

export default function Students() {
  const handleAddStudent = () => {
    console.log('Agregar estudiante')
  }

  const handleInviteStudent = () => {
    console.log('Invitar estudiante')
  }

  const students = [
    {
      id: 1,
      name: 'Juan Pérez',
      email: 'jperez@gmail.com',
      level: 'Intermedio',
      levelColor: 'bg-blue-500',
      goals: ['Perder peso', 'Ganar músculo'],
    },
    {
      id: 2,
      name: 'María Gómez',
      email: 'mgomez@gmail.com',
      level: 'Avanzado',
      levelColor: 'bg-green-500',
      goals: ['Mejorar resistencia'],
    },
    {
      id: 3,
      name: 'Carlos López',
      email: 'clopez@gmail.com',
      level: 'Principiante',
      levelColor: 'bg-yellow-500',
      goals: ['Tonificar'],
    },
    {
      id: 4,
      name: 'Ana Torres',
      email: 'atorrez@gmail.com',
      level: 'Intermedio',
      levelColor: 'bg-blue-500',
      goals: ['Perder peso'],
    },
  ]

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header fijo (no scrollea) */}
      <PageHeader>
        <PageHeader.Content>
          <div>
            <PageHeader.Title>Estudiantes</PageHeader.Title>
            <p className="text-sm text-gray-600 mt-1">
              Gestiona tus estudiantes y su progreso (2/2)
            </p>
          </div>
          <PageHeader.Actions>
            <button
              onClick={handleInviteStudent}
              className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invitar Estudiante</span>
            </button>
            <button
              onClick={handleAddStudent}
              className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Estudiante</span>
            </button>
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
              placeholder="Buscar estudiante..."
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
        </div>
      </section>

      {/* Contenido scrollable */}
      <main className="flex-1 overflow-auto">
        <div className="ps-4 pe-4 pb-4 max-w-8xl mx-auto">
          <div className="space-y-6">
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
              {/* Student Cards */}
              {students.map((student) => (
                <StudentCard key={student.id} student={student} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
