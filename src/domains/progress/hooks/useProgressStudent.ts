import { useSearchParams } from 'react-router-dom'
import { useStudents } from '@/domains/students/hooks/useStudents'
import type { Student } from '@/shared/domain/entities/student'

interface UseProgressStudentResult {
  students: Student[]
  /** El alumno cuyo progreso se está mirando, o `null` si no hay ninguno. */
  student: Student | null
  loading: boolean
  select: (studentId: string) => void
}

/**
 * De quién es el progreso que se está mirando.
 *
 * LA PANTALLA NO ERA DE NADIE. Enseñaba una racha y un nivel sin decir de quién,
 * y no podían ser del entrenador —no es él quien entrena— ni de un alumno
 * concreto, porque no había forma de elegirlo. Con datos escritos a mano la
 * pregunta no se notaba; en cuanto los números salen de sesiones reales, es la
 * primera que hay que responder.
 *
 * EN LA URL, no en estado interno. Así «Ver progreso» desde la ficha de un
 * alumno lleva directamente al suyo, el enlace se puede compartir y volver atrás
 * funciona. Es el mismo patrón que `?agendar` en la ficha.
 *
 * Sin parámetro se toma el primero de la lista, y su nombre se ve en la
 * cabecera: enseñar el progreso de alguien sin decir de quién es lo que había
 * que arreglar, no un valor por defecto.
 */
export function useProgressStudent(): UseProgressStudentResult {
  const { students, loading } = useStudents()
  const [searchParams, setSearchParams] = useSearchParams()

  const requested = searchParams.get('student')
  const selected = students.find((candidate) => candidate.id === requested) ?? students[0] ?? null

  const select = (studentId: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('student', studentId)
    // `replace` para que elegir alumnos no llene el historial: volver atrás debe
    // salir de progreso, no recorrer a quién se estuvo mirando.
    setSearchParams(next, { replace: true })
  }

  return { students, student: selected, loading, select }
}
