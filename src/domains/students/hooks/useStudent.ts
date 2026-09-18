import { useEffect, useState } from 'react'
import { container } from '@/app/container'
import type { Student } from '@/shared/domain/entities/student'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { describeError } from '@/shared/i18n/errorMessages'

interface UseStudentResult {
  student: Student | null
  loading: boolean
  error: string | null
}

/**
 * Un estudiante por su identificador.
 *
 * `null` cuando no existe, no una excepción: la ausencia es un resultado válido
 * —un enlace viejo, un identificador escrito a mano— y la vista debe poder
 * pintarla. Es la misma semántica de lo ausente que declaran los puertos.
 *
 * SUSCRITO A LOS CAMBIOS, como la lista. Editar, dar de baja y borrar se hacen
 * desde la propia ficha, y sin suscripción la ficha seguía enseñando lo de
 * antes de guardar: el menú ofrecía dar de baja a quien ya la había causado.
 */
export function useStudent(studentId: string | undefined): UseStudentResult {
  const { t } = useTranslation()
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!studentId) {
      setStudent(null)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    /*
     * `loading` sólo en la primera lectura. Las relecturas por un cambio no lo
     * vuelven a encender: la ficha lo pinta como esqueleto, y eso desmontaría
     * el diálogo que acaba de guardar mientras aún está abierto.
     */
    const load = () => {
      container.students
        .findById(studentId)
        .then((result) => {
          if (active) setStudent(result)
        })
        .catch((cause: unknown) => {
          if (active) setError(describeError(cause, t, 'students.loadOneError'))
        })
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
  }, [studentId, t])

  return { student, loading, error }
}
