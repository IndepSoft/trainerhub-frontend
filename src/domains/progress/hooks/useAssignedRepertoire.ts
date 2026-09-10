import { useEffect, useState } from 'react'
import { container } from '@/app/container'
import type { Assignment } from '@/shared/domain/entities/assignment'

/** Una asignación con el título de lo asignado, resuelto. */
export interface RepertoireEntry {
  assignment: Assignment
  /** El título del plan o la rutina, o `null` si ya no existe. */
  title: string | null
}

interface UseAssignedRepertoireResult {
  entries: RepertoireEntry[]
  loading: boolean
}

/**
 * Lo que le han asignado a quien mira: su repertorio.
 *
 * NO EXISTÍA DEL LADO DEL ALUMNO. La base le dejaba leer sus asignaciones y
 * ninguna pantalla las pintaba, así que «hay quien asigna un plan para que
 * el alumno lo siga por su cuenta» —la razón de que asignar no agende— no se
 * sostenía: el alumno no podía ver qué le habían dado. Aquí se lee lo mismo
 * que el entrenador ve en su ficha, con los títulos resueltos por el puerto:
 * las rutinas y los planes los leen los miembros.
 */
export function useAssignedRepertoire(studentId: string | undefined): UseAssignedRepertoireResult {
  const [entries, setEntries] = useState<RepertoireEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (studentId === undefined) {
      setEntries([])
      setLoading(false)
      return
    }

    let active = true

    const load = () => {
      void Promise.all([
        container.assignments.findByStudent(studentId),
        container.routines.findAll(),
        container.plans.findAll(),
      ])
        .then(([assignments, routines, plans]) => {
          if (!active) return
          const titles = new Map<string, string>()
          for (const routine of routines) titles.set(routine.id, routine.title)
          for (const plan of plans) titles.set(plan.id, plan.title)
          setEntries(
            assignments.map((assignment) => ({
              assignment,
              title:
                titles.get(assignment.kind === 'plan' ? assignment.planId : assignment.routineId) ??
                null,
            }))
          )
        })
        .catch(() => undefined)
        .finally(() => {
          if (active) setLoading(false)
        })
    }

    load()
    const unsubscribe = container.assignments.onChange(load)

    return () => {
      active = false
      unsubscribe()
    }
  }, [studentId])

  return { entries, loading }
}
