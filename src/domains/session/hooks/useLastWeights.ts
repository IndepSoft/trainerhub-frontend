import { useEffect, useState } from 'react'
import { container } from '@/app/container'
import type { SessionResult } from '@/shared/domain/entities/session'

/**
 * El último peso anotado de cada ejercicio, en sesiones ya cerradas.
 *
 * ES LO QUE CONVIERTE UN REGISTRO EN UNA PROGRESIÓN. Anotar el peso sin
 * recordarlo obligaría a escribirlo desde cero en cada serie de cada sesión, y
 * lo que se teclea cuatro veces por ejercicio se deja de teclear a la tercera
 * semana. Aquí el campo llega ya con lo que se levantó la última vez, y subir es
 * un toque.
 *
 * SÓLO DE SESIONES CON RESULTADO: una que se abandonó a medias no dice cuál era
 * la carga de trabajo.
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
      if (!active) return

      /*
       * Por `completedAt` y no por la fecha de la agenda: son cosas distintas
       * —una sesión del martes se puede cerrar el miércoles— y la que importa
       * aquí es cuándo se levantó ese peso de verdad.
       *
       * De la más reciente hacia atrás, así que la primera anotación que
       * aparezca de un ejercicio es la última que ocurrió.
       */
      const results = sessions
        .map((session) => session.result)
        .filter((result): result is SessionResult => result !== null)
        .sort((left, right) => right.completedAt.localeCompare(left.completedAt))

      const found = new Map<string, number>()

      for (const result of results) {
        for (const record of result.sets ?? []) {
          if (record.weightKg === undefined) continue
          if (found.has(record.exerciseId)) continue
          found.set(record.exerciseId, record.weightKg)
        }
      }

      setWeights(found)
    }

    void load()

    return () => {
      active = false
    }
  }, [studentId])

  return weights
}
