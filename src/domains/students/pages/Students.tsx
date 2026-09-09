import { useState } from 'react'
import { PageHeader } from '@/shared/components/PageHeader'
import { Plus } from 'lucide-react'
import { StudentCard } from '../components/StudentCard'
import { StudentFilters } from '../components/StudentFilters'
import { StudentFormDialog } from '../components/StudentFormDialog'
import { useStudents } from '../hooks/useStudents'
import { useStudentEditor } from '../hooks/useStudentEditor'
import { useStudentsProgress } from '../hooks/useStudentsProgress'
import {
  EMPTY_STUDENT_FILTERS,
  filterStudents,
  type StudentFilterState,
} from '../libs/filterStudents'
import { Button } from '@/shared/ui/button'
import type { NewStudent } from '@/shared/domain/ports/StudentRepository'
import { canEnrollMembers } from '@/shared/domain/entities/crew'
import { useViewerContext } from '@/app/ViewerContext'
import type { Student } from '@/shared/domain/entities/student'
import { useTranslation } from '@/shared/i18n/LanguageContext'

export default function Students() {
  const { t } = useTranslation()
  const { students, loading } = useStudents()
  const [filters, setFilters] = useState<StudentFilterState>(EMPTY_STUDENT_FILTERS)
  // En memoria: son decenas de fichas ya cargadas. Ver `filterStudents`.
  const visibleStudents = filterStudents(students, filters)
  const isFiltering = filters.query.trim() !== '' || filters.level !== 'all'
  const { createStudent, updateStudent } = useStudentEditor()
  const { progressById, loading: loadingProgress } = useStudentsProgress()
  const { active, can } = useViewerContext()

  /*
   * Dar de alta a alguien es incorporarlo al equipo, así que pasa por la misma
   * puerta que el QR. Editar y ver a los que ya están sigue abierto: lo que se
   * activa es crecer, no trabajar con quien ya tienes.
   */
  const canEnroll = can('crew.invite') && active !== null && canEnrollMembers(active.crew)

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
              {loading
                ? t('students.eyebrow')
                : t('students.eyebrowCount', { count: students.length })}
            </PageHeader.Eyebrow>
            <PageHeader.Title>{t('students.title')}</PageHeader.Title>
          </div>
          <PageHeader.Actions>
            {/* Un solo boton. «Invitar» y «Agregar» eran dos y hacian lo mismo
                -nada, los dos eran `console.log`-; ahora que el alumno se
                enlaza con su cuenta por el correo que se escribe aqui, dar de
                alta ES invitar. */}
            <Button onClick={openForNew} disabled={!canEnroll}>
              <Plus className="w-4 h-4" />
              <span>{t('students.add')}</span>
            </Button>
          </PageHeader.Actions>
        </PageHeader.Content>
      </PageHeader>

      {/*
        El porqué, donde se ve el botón apagado. Un control desactivado sin
        explicación es un control roto.

        Sólo se le dice a quien PODRÍA dar de alta: a un administrador que está
        observando el equipo, el botón le sale apagado por otro motivo —no es
        suyo— y decirle que falta la suscripción seria mentirle. Su motivo se lo
        explica la cinta de arriba.
      */}
      {can('crew.invite') && !canEnroll && active !== null && (
        <p className="ps-4 pe-4 pt-3 text-sm text-ink/55">
          {/* Pendiente y suspendida no se explican igual: a una le falta la
              activacion, a la otra se le retiro. */}
          {active.crew.subscriptionStatus === 'suspended'
            ? t('students.suspendedSubscription', { crew: active.crew.name })
            : t('students.needsSubscription', { crew: active.crew.name })}
        </p>
      )}

      <section className="pt-4 ps-4 pe-4 mb-6 space-y-6">
        <StudentFilters filters={filters} onChange={setFilters} />
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
              {visibleStudents.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  /* `undefined` mientras carga y `null` cuando no ha entrenado:
                     la tarjeta pinta cosas distintas, y confundirlos enseñaria
                     «sin sesiones» durante un instante a quien si las tiene. */
                  progress={loadingProgress ? undefined : (progressById.get(student.id) ?? null)}
                  onEdit={openForEdit}
                />
              ))}
            </div>

            {/* Dos vacíos distintos: no tener alumnos y no encontrar ninguno
                con estos filtros. Decir lo primero cuando pasa lo segundo
                manda a dar de alta a alguien que ya existe. */}
            {!loading && students.length === 0 ? (
              <p className="py-12 text-center text-sm text-ink/45">{t('students.empty')}</p>
            ) : null}
            {!loading && students.length > 0 && visibleStudents.length === 0 && isFiltering ? (
              <p className="py-12 text-center text-sm text-ink/45">{t('students.noMatches')}</p>
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
