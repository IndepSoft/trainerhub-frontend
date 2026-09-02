import { useCallback, useEffect, useState } from 'react'
import { container } from '@/app/container'
import { useStudents } from '@/domains/students/hooks/useStudents'
import { completedSessions } from '@/shared/domain/experience'
import { toLocalDateKey } from '@/shared/lib/dateKey'
import type { Student } from '@/shared/domain/entities/student'

/**
 * A partir de cuántos días sin entrenar se considera que alguien se está yendo.
 *
 * Catorce y no siete: una semana sin venir es un viaje, una gripe o una semana
 * mala, y avisar de eso llenaría la lista de falsos positivos hasta que dejara
 * de mirarse. Dos semanas ya no es un imprevisto.
 */
export const AT_RISK_DAYS = 14

export interface RetentionEntry {
  student: Student
  /** Último día que cerró una sesión, o `null` si nunca. */
  lastTrained: string | null
  /** Días desde entonces. `null` si nunca entrenó. */
  daysSince: number | null
}

interface UseRetentionResult {
  /** De más abandonado a menos: arriba quien lleva más sin venir. */
  entries: RetentionEntry[]
  atRiskCount: number
  loading: boolean
}

/** Días entre dos claves de fecha, comparando mediodías por el horario de verano. */
function daysBetween(from: string, to: string): number {
  const [fromYear, fromMonth, fromDay] = from.split('-').map(Number)
  const [toYear, toMonth, toDay] = to.split('-').map(Number)

  const start = new Date(fromYear, fromMonth - 1, fromDay, 12).getTime()
  const end = new Date(toYear, toMonth - 1, toDay, 12).getTime()

  return Math.round((end - start) / 86_400_000)
}

/**
 * Quién ha dejado de venir.
 *
 * ES LA PREGUNTA QUE MÁS DINERO MUEVE en un gimnasio, y la que ninguna pantalla
 * respondía. Un alumno que deja de aparecer no se da de baja: deja de renovar
 * tres semanas después, y para entonces ya no hay conversación que tener. La
 * cuota vencida llega tarde; esto llega antes.
 *
 * Se mide sobre `completedAt` y no sobre la fecha agendada: lo que cuenta es
 * haber venido, no que estuviera puesto en el calendario.
 */
export function useRetention(): UseRetentionResult {
  const { students, loading: loadingStudents } = useStudents()
  const [lastByStudent, setLastByStudent] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [today] = useState(() => toLocalDateKey(new Date()))

  const load = useCallback(async (): Promise<void> => {
    const sessions = completedSessions(await container.sessions.findAll())
    const latest = new Map<string, string>()

    for (const session of sessions) {
      const day = session.result?.completedAt
      if (session.studentId === null || day === undefined) continue

      const current = latest.get(session.studentId)
      if (current === undefined || day > current) latest.set(session.studentId, day)
    }

    setLastByStudent(latest)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
    return container.sessions.onChange(() => {
      void load()
    })
  }, [load])

  const entries: RetentionEntry[] = students.map((student) => {
    const lastTrained = lastByStudent.get(student.id) ?? null

    return {
      student,
      lastTrained,
      daysSince: lastTrained === null ? null : daysBetween(lastTrained, today),
    }
  })

  /*
   * Quien nunca entrenó va ARRIBA, al contrario que en la cola de cobros: allí
   * no debía nada, aquí es el caso más extremo de lo que la lista mide —lleva
   * desde siempre sin venir— y es justo a quien hay que enganchar.
   */
  const sorted = [...entries].sort((left, right) => {
    if (left.daysSince === null) return right.daysSince === null ? 0 : -1
    if (right.daysSince === null) return 1
    return right.daysSince - left.daysSince
  })

  return {
    entries: sorted,
    atRiskCount: entries.filter(
      (entry) => entry.daysSince === null || entry.daysSince >= AT_RISK_DAYS
    ).length,
    loading: loadingStudents || loading,
  }
}
