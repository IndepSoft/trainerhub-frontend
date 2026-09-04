import { useEffect, useState } from 'react'
import { container } from '@/app/container'
import { lastWeightByExercise } from '@/shared/domain/loadProgression'

/**
 * El último peso anotado de cada ejercicio, en sesiones ya cerradas.
 *
 * ES LO QUE CONVIERTE UN REGISTRO EN UNA PROGRESIÓN. Anotar el peso sin
 * recordarlo obligaría a escribirlo desde cero en cada serie de cada sesión, y
 * lo que se teclea cuatro veces por ejercicio se deja de teclear a la tercera
 * semana. Aquí el campo llega ya con lo que se levantó la última vez, y subir es
 * un toque.
 *
 * EL CÁLCULO NO ESTÁ AQUÍ: sale de `lastWeightByExercise`, que es el mismo
 * historial que pinta la ficha del alumno. Con dos definiciones de «el último
 * peso», la sesión y la ficha podrían decir cifras distintas del mismo día.
 *
 * NO BLOQUEA NADA. Devuelve un mapa vacío mientras carga, y la pantalla funciona
 * igual: sin historial —la primera sesión de alguien— tampoco habría nada que
 * ofrecer. Una pantalla que se abre con el teléfono en la mano no puede esperar
 * a una consulta para pintarse.
 */
export function useLastWeights(studentId: string | null): Map<string, number> {
  const [weights, setWeights] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    if (studentId === null) return

    let active = true

    const load = async () => {
      const sessions = await container.sessions.findByStudent(studentId)
      if (active) setWeights(lastWeightByExercise(sessions))
    }

    void load()

    return () => {
      active = false
    }
  }, [studentId])

  return weights
}
