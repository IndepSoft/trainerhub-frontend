import { useCallback } from 'react'
import { container } from '@/app/container'
import type { NewStudent } from '@/shared/domain/ports/StudentRepository'
import type { Student } from '@/shared/domain/entities/student'
import type { DeletionResult } from '@/shared/domain/deletion'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface UseStudentEditorResult {
  createStudent: (data: NewStudent) => Promise<Student>
  updateStudent: (studentId: string, data: NewStudent) => Promise<void>
  /** Por qué NO se puede borrar, o `undefined` si se puede. */
  deletionBlocker: (studentId: string) => Promise<string | undefined>
  deleteStudent: (studentId: string) => Promise<DeletionResult>
}

/**
 * Altas, ediciones y bajas de estudiantes.
 *
 * `StudentRepository` era el ÚNICO puerto sin `create` —todos los demás lo
 * tenían— y «Añadir estudiante» era un `console.log`. Un entrenador que
 * instalara la aplicación no podía meter a nadie: el hueco más grande que
 * quedaba, porque sin alumnos no hay nada que asignar ni que agendar.
 *
 * BORRAR ESTÁ PROTEGIDO, como en el resto del dominio. Un alumno con sesiones
 * agendadas no se borra: esas sesiones guardan su identificador y quedarían
 * apuntando al vacío. La agenda degrada —pinta «Alumno no disponible»— y aun así
 * romperla en silencio no es aceptable.
 */
export function useStudentEditor(): UseStudentEditorResult {
  const { plural } = useTranslation()
  const createStudent = useCallback(
    (data: NewStudent) => container.students.create(data),
    []
  )

  const updateStudent = useCallback(
    (studentId: string, data: NewStudent) => container.students.update(studentId, data),
    []
  )

  const deletionBlocker = useCallback(async (studentId: string) => {
    const sessions = await container.sessions.findByStudent(studentId)
    if (sessions.length === 0) return undefined

    return plural('students.hasSession', 'students.hasSessions', sessions.length, {
      count: sessions.length,
    })
  }, [plural])

  const deleteStudent = useCallback(
    async (studentId: string): Promise<DeletionResult> => {
      // Se vuelve a comprobar y no se confía en que la vista lo haya hecho:
      // entre abrir el diálogo y confirmar puede haberse agendado algo.
      const reason = await deletionBlocker(studentId)
      if (reason !== undefined) return { deleted: false, reason }

      await container.students.remove(studentId)
      return { deleted: true }
    },
    [deletionBlocker]
  )

  return { createStudent, updateStudent, deletionBlocker, deleteStudent }
}
