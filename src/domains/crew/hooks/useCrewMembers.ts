import { useCallback, useEffect, useState } from 'react'
import { container } from '@/app/container'
import type { Student } from '@/shared/domain/entities/student'

interface UseCrewMembersResult {
  /** Los que son del equipo: entrenan ahí, tengan cuenta o no. */
  members: Student[]
  /** Los que han escaneado el QR y esperan el visto bueno. Aún no son del equipo. */
  pending: Student[]
  loading: boolean
  approve: (studentId: string) => Promise<void>
  reject: (studentId: string) => Promise<void>
}

/**
 * Los miembros del crew activo, y aparte quien pide entrar.
 *
 * DOS GRUPOS, NO TRES. Tener cuenta o no tenerla no cambia si alguien es del
 * equipo: un alumno con ficha entrena ahí y se le agenda igual, sólo que todavía
 * no puede entrar a ver su progreso. Separarlos hacía que la pantalla dijera
 * «0 miembros» sobre un equipo con cuatro alumnos.
 *
 * Lo que sí va aparte es lo que EXIGE UNA DECISIÓN: quien escaneó el QR y espera
 * el visto bueno todavía no es del equipo.
 *
 * No hace falta pasarle el crew: `students.findAll` ya devuelve los del activo.
 */
export function useCrewMembers(): UseCrewMembersResult {
  const [students, setStudents] = useState<Student[]>([])
  const [requests, setRequests] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (): Promise<void> => {
    // Las dos van juntas: son la misma pantalla y encadenarlas pagaría dos
    // viajes de red seguidos para pintarla una vez.
    const [found, requests] = await Promise.all([
      container.students.findAll(),
      container.students.findRequests(),
    ])
    setStudents(found)
    setRequests(requests)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
    // Suscrito: aceptar a alguien tiene que verse sin recargar, y el alta desde
    // la pantalla de alumnos también.
    return container.students.onChange(() => {
      void load()
    })
  }, [load])

  const approve = useCallback(async (studentId: string) => {
    await container.students.updateMembership(studentId, 'active')
  }, [])

  const reject = useCallback(async (studentId: string) => {
    await container.students.updateMembership(studentId, 'rejected')
  }, [])

  return { members: students, pending: requests, loading, approve, reject }
}
