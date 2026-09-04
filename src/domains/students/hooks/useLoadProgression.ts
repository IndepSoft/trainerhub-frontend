import { useEffect, useState } from 'react'
import { container } from '@/app/container'
import { buildLoadProgression, type ExerciseLoadHistory } from '@/shared/domain/loadProgression'
import type { Exercise } from '@/shared/domain/entities/exercise'

/** Un ejercicio con su historial de cargas y el nombre ya resuelto. */
export interface NamedLoadHistory extends ExerciseLoadHistory {
  exerciseName: string
}

interface UseLoadProgressionResult {
  histories: NamedLoadHistory[]
  loading: boolean
}

/**
 * La progresión de cargas de un alumno, ejercicio a ejercicio.
 *
 * DOS LECTURAS Y NO UNA: las sesiones traen el identificador del ejercicio, y
 * una progresión que dijera «ejercicio-3 subió 5 kg» no serviría de nada. Van en
 * paralelo porque son independientes; encadenarlas sólo sumaría latencias
 * cuando haya red de verdad.
 *
 * ORDENADAS POR LO QUE MÁS SE TRABAJA. Un alumno con veinte ejercicios en el
 * historial no quiere una lista alfabética: quiere arriba lo que hace cada
 * semana, que es donde de verdad se ve si progresa.
 */
export function useLoadProgression(studentId: string | undefined): UseLoadProgressionResult {
  const [histories, setHistories] = useState<NamedLoadHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (studentId === undefined) {
      setLoading(false)
      return
    }

    let active = true

    const load = async () => {
      const [sessions, exercises] = await Promise.all([
        container.sessions.findByStudent(studentId),
        container.exercises.findAll(),
      ])

      if (!active) return

      const namesById = new Map(exercises.map((exercise: Exercise) => [exercise.id, exercise.name]))

      const named = buildLoadProgression(sessions)
        .map((history) => ({
          ...history,
          // Un ejercicio borrado del catálogo deja sus series huérfanas: se
          // omite en vez de pintar un hueco, porque sin nombre no dice nada.
          exerciseName: namesById.get(history.exerciseId) ?? '',
        }))
        .filter((history) => history.exerciseName !== '')
        .sort((left, right) => right.points.length - left.points.length)

      setHistories(named)
      setLoading(false)
    }

    void load()

    return () => {
      active = false
    }
  }, [studentId])

  return { histories, loading }
}
