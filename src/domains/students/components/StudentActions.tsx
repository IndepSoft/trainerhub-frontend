import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '@/shared/components/PageHeader'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/shared/ui/dropdown-menu'
import { ConfirmDeleteDialog } from '@/shared/components/ConfirmDeleteDialog'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { getShortName } from '@/shared/lib/personName'
import { describeError } from '@/shared/i18n/errorMessages'
import { useViewerContext } from '@/app/ViewerContext'
import { useStudentEditor } from '../hooks/useStudentEditor'
import { StudentFormDialog } from './StudentFormDialog'
import type { Student } from '@/shared/domain/entities/student'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface StudentActionsProps {
  student: Student
}

/**
 * Lo que se decide SOBRE un alumno: editar su ficha, darle de baja, borrarlo.
 *
 * VIVE EN LA FICHA, no en la lista. Estaba en el menú de cada tarjeta del
 * padrón, y ahí sobraba por dos motivos: el padrón se mira para ENCONTRAR a
 * alguien —cada fila lleva a su ficha y nada más—, y un menú de tres puntos por
 * fila multiplicaba por cuatro los destinos táctiles de una pantalla que se
 * recorre con el pulgar. Aquí hay uno, y está donde ya se está mirando a la
 * persona sobre la que se decide.
 *
 * Las tres van juntas en un menú y no sueltas en la cabecera: son de las que se
 * usan una vez en la vida de una ficha, y una de ellas destruye. El toque de
 * más es parte de la protección.
 */
export function StudentActions({ student }: StudentActionsProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { can } = useViewerContext()
  const { updateStudent, deletionBlocker, deleteStudent, deactivateStudent } =
    useStudentEditor()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [deactivateError, setDeactivateError] = useState<string | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [blockedReason, setBlockedReason] = useState<string | undefined>(undefined)

  const fullName = getShortName(student.firstName, student.lastName)

  /*
   * Sin la llave no hay menu, ni siquiera apagado. Editar y borrar los exige la
   * politica de `students` en la base, asi que a un miembro raso las tres
   * entradas le fallarian una a una; la tarjeta las ofrecia igualmente.
   */
  if (!can('students.manage')) return null

  /*
   * Los dialogos se abren con el menu cerrado A MANO, y no dejando que Radix lo
   * cierre al elegir: al cerrarse solo, devuelve el foco al disparador y el
   * dialogo naciente se lo encuentra ya movido. `preventDefault` evita el
   * cierre automatico y `setIsMenuOpen(false)` lo hace en el mismo turno. Es el
   * patron que ya funcionaba en el menu de la tarjeta del padron.
   */
  const openFromMenu = (event: Event, open: () => void): void => {
    event.preventDefault()
    setIsMenuOpen(false)
    open()
  }

  // Una baja no se da dos veces: la ficha de un alumno dado de baja se abre
  // desde la lista de bajas, y ahi lo que toca es reactivarle.
  const mayDeactivate = can('crew.members') && student.membershipStatus !== 'inactive'

  return (
    <>
      <PageHeader.OverflowMenu
        label={t('studentCard.actions', { name: fullName })}
        open={isMenuOpen}
        onOpenChange={setIsMenuOpen}
      >
        <DropdownMenuItem
          onSelect={(event) => openFromMenu(event, () => setIsFormOpen(true))}
        >
          {t('common.edit')}
        </DropdownMenuItem>

        {/* LA BAJA es de `crew.members`, como aceptar y rechazar: es una
            decisión sobre la pertenencia, no sobre la ficha. */}
        {mayDeactivate && (
          <DropdownMenuItem
            onSelect={(event) =>
              openFromMenu(event, () => {
                setDeactivateError(null)
                setIsDeactivateOpen(true)
              })
            }
          >
            {t('students.deactivate')}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-danger"
          onSelect={(event) =>
            openFromMenu(event, () => {
              void deletionBlocker(student.id).then((reason) => {
                setBlockedReason(reason)
                setIsDeleteOpen(true)
              })
            })
          }
        >
          {t('common.delete')}
        </DropdownMenuItem>
      </PageHeader.OverflowMenu>

      <StudentFormDialog
        open={isFormOpen}
        student={student}
        onOpenChange={setIsFormOpen}
        onSave={(data) => updateStudent(student.id, data)}
      />

      <ConfirmDialog
        open={isDeactivateOpen}
        title={t('students.deactivateTitle', { name: fullName })}
        body={t('students.deactivateBody')}
        confirmLabel={t('students.deactivate')}
        destructive
        busy={deactivating}
        error={deactivateError}
        onOpenChange={setIsDeactivateOpen}
        onConfirm={() => {
          setDeactivating(true)
          setDeactivateError(null)
          void deactivateStudent(student.id)
            .then(() => {
              setIsDeactivateOpen(false)
              toast.success(t('students.deactivated', { name: fullName }))
            })
            .catch((caught: unknown) => {
              setDeactivateError(describeError(caught, t, 'students.membershipError'))
            })
            .finally(() => setDeactivating(false))
        }}
      />

      <ConfirmDeleteDialog
        open={isDeleteOpen}
        name={fullName}
        kind={t('studentCard.kind')}
        blockedReason={blockedReason}
        onOpenChange={setIsDeleteOpen}
        onConfirm={() => {
          void deleteStudent(student.id).then((result) => {
            // Se sale de la ficha al borrarla. En la tarjeta bastaba con cerrar
            // el diálogo porque la lista seguía debajo; aquí, quedarse deja al
            // entrenador mirando la ficha de alguien que ya no existe.
            if (result.deleted) navigate('/students')
            else setBlockedReason(result.reason)
          })
        }}
      />
    </>
  )
}
