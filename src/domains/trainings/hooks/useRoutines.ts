import { useCallback, useEffect, useState } from 'react'
import { container } from '@/app/container'
import { crewScope } from '@/app/crewScope'
import { useCachedQuery } from '@/shared/hooks/useCachedQuery'
import type { Routine } from '@/shared/domain/entities/routine'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { describeError } from '@/shared/i18n/errorMessages'

interface UseRoutinesResult {
  routines: Routine[]
  loading: boolean
  error: string | null
}

/** Referencia estable para el «todavía nada»: un literal nuevo por renderizado haría trabajo de más. */
const NONE: Routine[] = []

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
  const { data, loading, error } = useCachedQuery<Routine[]>({
    /*
     * El equipo activo entra en la clave. Sin él, al cambiar de equipo se
     * pintaría un instante lo del anterior, que es justo la fuga que el
     * ámbito existe para evitar.
     */
    key: ['routines', crewScope.current()],
    load: () => container.routines.findAll(),
    // Suscrito: un alta tiene que verse sin recargar.
    subscribe: (reload) => container.routines.onChange(reload),
    initial: NONE,
    errorKey: 'routine.loadError',
  })

  return { routines: data, loading, error }
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
  const { t } = useTranslation()
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
        if (active) setError(describeError(cause, t, 'routine.loadOneError'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [routineId, t])

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
