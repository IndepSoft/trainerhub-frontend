import { useState } from 'react'
import { PageHeader } from '@/shared/components/PageHeader'
import { Plus } from 'lucide-react'
import { StudentRow } from '../components/StudentRow'
import { StudentFilters } from '../components/StudentFilters'
import { StudentFormDialog } from '../components/StudentFormDialog'
import { InactiveStudents } from '../components/InactiveStudents'
import { useStudents } from '../hooks/useStudents'
import { useStudentEditor } from '../hooks/useStudentEditor'
import { useStudentsProgress } from '../hooks/useStudentsProgress'
import { useSubscriptions } from '../hooks/useSubscriptions'
import {
  EMPTY_STUDENT_FILTERS,
  filterStudents,
  type StudentFilterState,
} from '../libs/filterStudents'
import { canEnrollMembers } from '@/shared/domain/entities/crew'
import { useViewerContext } from '@/app/ViewerContext'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { PAGE_SCROLL } from '@/shared/lib/pageScroll'

export default function Students() {
  const { t } = useTranslation()
  const { students, loading } = useStudents()
  const [filters, setFilters] = useState<StudentFilterState>(EMPTY_STUDENT_FILTERS)
  // En memoria: son decenas de fichas ya cargadas. Ver `filterStudents`.
  const visibleStudents = filterStudents(students, filters)
  const isFiltering = filters.query.trim() !== '' || filters.level !== 'all'
  const { createStudent } = useStudentEditor()
  const { progressById, loading: loadingProgress } = useStudentsProgress()
  const { standingOf } = useSubscriptions()
  const { active, can } = useViewerContext()

  /*
   * Dar de alta a alguien es incorporarlo al equipo, así que pasa por la misma
   * puerta de suscripción que el QR. Editar y ver a los que ya están sigue
   * abierto: lo que se activa es crecer, no trabajar con quien ya tienes.
   *
   * La CAPACIDAD es `students.manage`, que es la que exige la política de
   * inserción de `students`. Preguntaba por `crew.invite`, y a quien tuviera
   * sólo esa llave prestada le salía el botón y le fallaba la escritura.
   */
  const canEnroll = can('students.manage') && active !== null && canEnrollMembers(active.crew)

  const [isFormOpen, setIsFormOpen] = useState(false)

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-bone">
      <PageHeader>
        <PageHeader.Content>
          {/* Sin el contador mientras carga: con el hook asincrono, «Tu equipo · 0»
              aparecia un instante en cada visita y se leia como que no hay
              nadie. */}
          <PageHeader.Eyebrow>
            {loading
              ? t('students.eyebrow')
              : t('students.eyebrowCount', { count: students.length })}
          </PageHeader.Eyebrow>
          <PageHeader.Title>{t('students.title')}</PageHeader.Title>
          <PageHeader.Actions>
            {/* Un solo boton. «Invitar» y «Agregar» eran dos y hacian lo mismo
                -nada, los dos eran `console.log`-; ahora que el alumno se
                enlaza con su cuenta por el correo que se escribe aqui, dar de
                alta ES invitar. */}
            <PageHeader.PrimaryAction
              icon={Plus}
              label={t('students.add')}
              shortLabel={t('students.addShort')}
              onClick={() => setIsFormOpen(true)}
              disabled={!canEnroll}
            />
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
      {can('students.manage') && !canEnroll && active !== null && (
        <p className="ps-4 pe-4 pt-3 text-sm text-ink/55">
          {/* Pendiente y suspendida no se explican igual: a una le falta la
              activacion, a la otra se le retiro. */}
          {active.crew.subscriptionStatus === 'suspended'
            ? t('students.suspendedSubscription', { crew: active.crew.name })
            : t('students.needsSubscription', { crew: active.crew.name })}
        </p>
      )}

      {/* `px-5`, el mismo margen que la cabecera: con `px-4` la lista
          arrancaba cuatro pixeles a la izquierda del titulo. */}
      <section className="px-5 pt-4">
        <StudentFilters filters={filters} onChange={setFilters} />
      </section>

      {/* Contenedor de scroll de la pagina. Es un div y no un <main> a
          proposito: el landmark <main> ya lo pinta SidebarInset desde
          RootLayout, y anidar uno dentro de otro es HTML invalido -solo se
          admite uno por documento- ademas de confundir a los lectores de
          pantalla. */}
      <div className={PAGE_SCROLL}>
        <div className="mx-auto max-w-4xl px-5 pb-4">
          {/*
            FILAS Y NO TARJETAS. Esta lista es para ENCONTRAR a alguien, no para
            leer su ficha: cada tarjeta ocupaba 320 px y en un telefono cabia una
            y media, asi que dar con un alumno era desplazar. Lo que la tarjeta
            enseñaba —edad, grasa, objetivos, la franja de progreso— esta a un
            toque. Ver `ListRow`.
          */}
          <ul aria-label={t('students.title')} className="mt-3">
            {visibleStudents.map((student) => (
              <StudentRow
                key={student.id}
                student={student}
                /* `undefined` mientras carga y `null` cuando no ha entrenado:
                   la fila pinta cosas distintas, y confundirlos enseñaria
                   «sin sesiones» durante un instante a quien si las tiene. */
                progress={loadingProgress ? undefined : (progressById.get(student.id) ?? null)}
                standing={standingOf(student.id)}
              />
            ))}
          </ul>

          {/* Que se hace con la lista, dicho una vez. Una fila que no enseña un
              menu tiene que decir a donde lleva. */}
          {visibleStudents.length > 0 && (
            <p className="pt-3 text-[13px] text-ink/45">{t('students.rowHint')}</p>
          )}

          {/* Dos vacíos distintos: no tener alumnos y no encontrar ninguno
              con estos filtros. Decir lo primero cuando pasa lo segundo
              manda a dar de alta a alguien que ya existe. */}
          {!loading && students.length === 0 ? (
            <p className="py-12 text-center text-sm text-ink/45">{t('students.empty')}</p>
          ) : null}
          {!loading && students.length > 0 && visibleStudents.length === 0 && isFiltering ? (
            <p className="py-12 text-center text-sm text-ink/45">{t('students.noMatches')}</p>
          ) : null}

          {/* Las bajas, plegadas: quien puede reactivarlas las encuentra aqui. */}
          {can('crew.members') && (
            <div className="pt-6">
              <InactiveStudents />
            </div>
          )}
        </div>
      </div>

      <StudentFormDialog
        open={isFormOpen}
        student={null}
        onOpenChange={setIsFormOpen}
        onSave={async (data) => {
          await createStudent(data)
        }}
      />
    </div>
  )
}
