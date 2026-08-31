import { useCallback, useEffect, useState } from 'react'
import { container } from '@/app/container'
import type { Routine } from '@/shared/domain/entities/routine'

interface UseRoutinesResult {
  routines: Routine[]
  loading: boolean
  error: string | null
}

/**
 * Lista de rutinas.
 *
 * Lee del PUERTO, no de un almacén del dominio. Ese cambio es lo que permite que
 * la agenda ofrezca las mismas rutinas al agendar una sesión sin importar nada
 * de aquí: los dos dominios leen del mismo sitio. Es exactamente lo que ya hacen
 * `useStudents` y `useSchedulableStudents` con los alumnos.
 *
 * Se SUSCRIBE a los cambios además de leer una vez. Sin la suscripción, una
 * lista ya montada no se enteraría de la rutina que otra vista acaba de crear o
 * borrar, y la alternativa —refrescar a mano desde cada sitio que muta— reparte
 * por la aplicación una responsabilidad del almacén.
 */
export function useRoutines(): UseRoutinesResult {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Bandera de cancelación: si el componente se desmonta antes de que
    // resuelva, escribir estado provocaría una advertencia y, con red real, una
    // respuesta vieja podría pisar a una nueva.
    let active = true

    const load = () => {
      container.routines
        .findAll()
        .then((result) => {
          if (active) setRoutines(result)
        })
        .catch((cause: unknown) => {
          if (active) setError(cause instanceof Error ? cause.message : 'Error al cargar rutinas')
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }

    load()
    const unsubscribe = container.routines.onChange(load)

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return { routines, loading, error }
}

interface UseRoutineResult {
  routine: Routine | null
  loading: boolean
  error: string | null
}

/**
 * Una rutina por su identificador.
 *
 * `null` cuando no existe, no una excepción: un enlace viejo es un resultado
 * válido y la vista debe poder pintarlo. Ojo al usarlo: `routine === null` NO
 * significa «no existe» hasta que `loading` es falso, o la ficha pintaría «no
 * encontrada» durante el primer render de toda rutina.
 */
export function useRoutine(routineId: string | undefined): UseRoutineResult {
  const [routine, setRoutine] = useState<Routine | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (routineId === undefined) {
      setRoutine(null)
      setLoading(false)
      return () => {}
    }

    let active = true
    setLoading(true)

    container.routines
      .findById(routineId)
      .then((result) => {
        if (active) setRoutine(result)
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Error al cargar la rutina')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [routineId])

  useEffect(() => {
    let cancel = load()
    const unsubscribe = container.routines.onChange(() => {
      cancel()
      cancel = load()
    })

    return () => {
      cancel()
      unsubscribe()
    }
  }, [load])

  return { routine, loading, error }
}
