import { useEffect, useState } from 'react'
import { container } from '@/app/container'
import type { Student } from '@/shared/domain/entities/student'

interface UseInactiveStudentsResult {
  inactive: Student[]
  loading: boolean
}

/**
 * Las bajas del equipo activo. Aparte de `useStudents` porque no son del
 * padrón: no se les agenda, no cuentan, y sólo las mira quien puede
 * reactivarlas.
 */
export function useInactiveStudents(): UseInactiveStudentsResult {
  const [inactive, setInactive] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const load = () => {
      container.students
        .findInactive()
        .then((result) => {
          if (active) setInactive(result)
        })
        .catch(() => undefined)
        .finally(() => {
          if (active) setLoading(false)
        })
    }

    load()
    const unsubscribe = container.students.onChange(load)

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return { inactive, loading }
}
