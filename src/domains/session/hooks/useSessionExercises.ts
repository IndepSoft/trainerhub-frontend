import { useEffect, useMemo, useState } from 'react'
import { container } from '@/app/container'
import type { Exercise } from '@/shared/domain/entities/exercise'

/**
 * Los ejercicios del catálogo, indexados por identificador.
 *
 * Existe para que este dominio NO importe nada de `trainings`, igual que
 * `useSchedulableStudents` en la agenda. Una prescripción guarda `exerciseId`, y
 * pintar un bloque exige convertirlo en nombre.
 *
 * Devuelve el índice y no la lista porque el uso aquí es siempre resolver un
 * identificador: buscar con `find` por cada ejercicio de cada bloque convierte
 * el pintado de una rutina en un recorrido cuadrático.
 */
export function useSessionExercises(): Map<string, Exercise> {
  const [exercises, setExercises] = useState<Exercise[]>([])

  useEffect(() => {
    let active = true

    container.exercises.findAll().then((result) => {
      if (active) setExercises(result)
    })

    return () => {
      active = false
    }
  }, [])

  return useMemo(
    () => new Map(exercises.map((exercise) => [exercise.id, exercise])),
    [exercises]
  )
}
