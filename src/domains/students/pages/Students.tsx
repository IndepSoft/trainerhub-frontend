import { useState } from 'react'
import { PageHeader } from '@/shared/components/PageHeader'
import { Plus } from 'lucide-react'
import { StudentCard } from '../components/StudentCard'
import { StudentFilters } from '../components/StudentFilters'
import { StudentFormDialog } from '../components/StudentFormDialog'
import { useStudents } from '../hooks/useStudents'
import { useStudentEditor } from '../hooks/useStudentEditor'
import { Button } from '@/shared/ui/button'
import type { NewStudent } from '@/shared/domain/ports/StudentRepository'
import type { Student } from '@/shared/domain/entities/student'

export default function Students() {
  const { students, loading } = useStudents()
  const { createStudent, updateStudent } = useStudentEditor()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)

  const openForNew = () => {
    setEditing(null)
    setIsFormOpen(true)
  }

  const openForEdit = (student: Student) => {
    setEditing(student)
    setIsFormOpen(true)
  }

  const handleSave = async (data: NewStudent) => {
    if (editing === null) {
      await createStudent(data)
      return
    }
    await updateStudent(editing.id, data)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-bone">
      <PageHeader>
        <PageHeader.Content>
          <div>
            {/* Sin el contador mientras carga: con el hook asincrono, «Tu equipo · 0»
                aparecia un instante en cada visita y se leia como que no hay
                nadie. */}
            <PageHeader.Eyebrow>
              {loading ? 'Tu equipo' : `Tu equipo · ${students.length}`}
            </PageHeader.Eyebrow>
            <PageHeader.Title>Estudiantes</PageHeader.Title>
          </div>
          <PageHeader.Actions>
            {/* Un solo boton. «Invitar» y «Agregar» eran dos y hacian lo mismo
                -nada, los dos eran `console.log`-; ahora que el alumno se
                enlaza con su cuenta por el correo que se escribe aqui, dar de
                alta ES invitar. */}
            <Button onClick={openForNew}>
              <Plus className="w-4 h-4" />
              <span>Añadir alumno</span>
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
                <StudentCard key={student.id} student={student} onEdit={openForEdit} />
              ))}
            </div>

            {!loading && students.length === 0 ? (
              <p className="py-12 text-center text-sm text-ink/45">
                Aún no tienes alumnos. Añade el primero para poder asignarle rutinas y agendarle
                sesiones.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <StudentFormDialog
        open={isFormOpen}
        student={editing}
        onOpenChange={setIsFormOpen}
        onSave={handleSave}
      />
    </div>
  )
}
