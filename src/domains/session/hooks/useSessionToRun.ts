import { useEffect, useState } from 'react'
import { container } from '@/app/container'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import type { Session } from '@/shared/domain/entities/session'
import type { Routine } from '@/shared/domain/entities/routine'

interface UseSessionToRunResult {
  session: Session | null
  /** La rutina que ejecuta, o `null` si no tiene o es de cardio. */
  routine: Routine | null
  /** El nombre del alumno, ya resuelto. «Clase grupal» cuando no es de nadie. */
  studentName: string
  loading: boolean
}

/**
 * Todo lo que hace falta para ejecutar una sesión concreta.
 *
 * Existe porque la pantalla en vivo dejó de ser una sola: antes `/session` no
 * recibía nada y siempre pintaba la misma sesión simulada, así que agendar «Full
 * body» para María y pulsar iniciar te dejaba en la sesión de otra persona
 * corriendo por un mapa. Ahora recibe su identificador y resuelve lo suyo.
 *
 * Resuelve las TRES cosas de una vez —sesión, rutina y nombre— porque la
 * pantalla las necesita a la vez y encadenarlas desde el componente habría
 * dejado tres estados de carga que parpadean por separado.
 */
export function useSessionToRun(sessionId: string | undefined): UseSessionToRunResult {
  const { t } = useTranslation()
  const [session, setSession] = useState<Session | null>(null)
  const [routine, setRoutine] = useState<Routine | null>(null)
  const [studentName, setStudentName] = useState(() => t('session.groupClass'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionId === undefined) {
      setLoading(false)
      return
    }

    let active = true

    const load = async () => {
      const found = await container.sessions.findById(sessionId)
      if (!active) return

      setSession(found)

      if (found === null) {
        setLoading(false)
        return
      }

      // En paralelo: son dos lecturas independientes y encadenarlas sólo
      // sumaría latencias cuando haya red de verdad.
      const [itsRoutine, itsStudent] = await Promise.all([
        found.routineId === null ? null : container.routines.findById(found.routineId),
        found.studentId === null ? null : container.students.findById(found.studentId),
      ])

      if (!active) return

      setRoutine(itsRoutine)
      setStudentName(
        itsStudent === null
          ? t('session.groupClass')
          : `${itsStudent.firstName} ${itsStudent.lastName}`
      )
      setLoading(false)
    }

    void load()

    return () => {
      active = false
    }
  }, [sessionId, t])

  return { session, routine, studentName, loading }
}
