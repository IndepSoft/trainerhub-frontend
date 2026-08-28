import { PageHeader } from '@/shared/components/PageHeader'
import { Plus, UserPlus } from 'lucide-react'
import { StudentCard } from '../components/StudentCard'
import { StudentFilters } from '../components/StudentFilters'
import { useStudents } from '../hooks/useStudents'
import { Button } from '@/shared/ui/button'

export default function Students() {
  const { students } = useStudents()

  // TODO: sin implementar. Deben pasar a `useStudents` cuando exista el
  // repositorio, para que la pagina siga siendo solo composicion.
  const handleAddStudent = () => {
    console.log('Agregar estudiante')
  }

  const handleInviteStudent = () => {
    console.log('Invitar estudiante')
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <PageHeader>
        <PageHeader.Content>
          <div>
            <PageHeader.Title>Estudiantes</PageHeader.Title>
            <p className="text-sm text-gray-600 mt-1">
              Gestiona tus estudiantes y su progreso ({students.length})
            </p>
          </div>
          <PageHeader.Actions>
            <Button variant="outline" onClick={handleInviteStudent}>
              <UserPlus className="w-4 h-4" />
              <span>Invitar Estudiante</span>
            </Button>
            <Button onClick={handleAddStudent}>
              <Plus className="w-4 h-4" />
              <span>Agregar Estudiante</span>
            </Button>
          </PageHeader.Actions>
        </PageHeader.Content>
      </PageHeader>

      <section className="pt-4 ps-4 pe-4 mb-6 space-y-6">
        <StudentFilters />
      </section>

      {/* Contenedor de scroll de la pagina. Es un div y no un <main> a
          proposito: el landmark <main> ya lo pinta SidebarInset desde
          RootLayout, y anidar uno dentro de otro es HTML invalido -solo se
          admite uno por documento- ademas de confundir a los lectores de
          pantalla. */}
      <div className="flex-1 overflow-auto">
        <div className="ps-4 pe-4 pb-4 max-w-8xl mx-auto">
          <div className="space-y-6">
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
              {students.map((student) => (
                <StudentCard key={student.id} student={student} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
