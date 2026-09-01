import { useSearchParams } from 'react-router-dom'
import { useStudents } from '@/domains/students/hooks/useStudents'
import { useViewerContext } from '@/app/ViewerContext'
import type { Student } from '@/shared/domain/entities/student'

interface UseProgressStudentResult {
  /** A quién se puede mirar. Vacío para un alumno: sólo se mira a sí mismo. */
  students: Student[]
  /** El alumno cuyo progreso se está mirando, o `null` si no hay ninguno. */
  student: Student | null
  /** Si la pantalla es sobre uno mismo. Cambia todo lo que dice. */
  isOwnProgress: boolean
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
 * Y LA RESPUESTA DEPENDE DEL PAPEL. Un entrenador mira a UNO DE SUS ALUMNOS, así
 * que elige; un alumno se mira A SÍ MISMO, y ofrecerle un selector con sus
 * compañeros sería enseñarle datos que no son suyos. Es la misma pantalla
 * respondiendo a dos preguntas distintas.
 *
 * Para el entrenador el alumno va EN LA URL, `?student=<id>`: así «Ver progreso»
 * desde una ficha lleva al suyo, el enlace se comparte y volver atrás funciona.
 * Es el mismo patrón que `?agendar` en la ficha del alumno.
 */
export function useProgressStudent(): UseProgressStudentResult {
  const { role, active, loading: loadingViewer } = useViewerContext()
  const { students, loading: loadingStudents } = useStudents()
  const [searchParams, setSearchParams] = useSearchParams()

  const select = (studentId: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('student', studentId)
    // `replace` para que elegir alumnos no llene el historial: volver atrás debe
    // salir de progreso, no recorrer a quién se estuvo mirando.
    setSearchParams(next, { replace: true })
  }

  if (role !== 'trainer') {
    return {
      // Sin lista: un alumno no elige a quién mira. `active.student` es su
      // propia ficha en el crew activo, y `null` cuando aún no tiene ninguno.
      students: [],
      student: active?.student ?? null,
      isOwnProgress: true,
      loading: loadingViewer,
      select,
    }
  }

  const requested = searchParams.get('student')
  const selected = students.find((candidate) => candidate.id === requested) ?? students[0] ?? null

  return {
    students,
    student: selected,
    isOwnProgress: false,
    loading: loadingStudents,
    select,
  }
}
