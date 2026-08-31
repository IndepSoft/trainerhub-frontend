import { create } from 'zustand'
import { sessionsMock } from '../data/sessions.mock'
import type { Session } from '../types/calendar.types'

interface SessionsState {
  sessions: Session[]
  createSession: (data: Omit<Session, 'id'>) => Session
}

/**
 * Sesiones de la agenda.
 *
 * Existe porque agendar tiene que dejar algo detrás. Hasta ahora el formulario
 * de alta sólo lanzaba un aviso —«Sesión con María el 3/9 a las 09:00»— y la
 * sesión no llegaba a existir. El `TODO` lo decía y era honesto mientras el alta
 * no fuese el final de ningún flujo; deja de serlo en cuanto hay uno que empieza
 * en una rutina y termina, supuestamente, en una sesión agendada.
 *
 * Mismo razonamiento que en `plansStore` sobre por qué esto no es un puerto: la
 * `Session` sólo la usa `calendar`. El día que la ficha de un estudiante liste
 * sus sesiones, la entidad cruza y nace `SessionRepository`.
 *
 * TODO: vive sólo en memoria. Al recargar vuelve la semilla.
 */
export const useSessionsStore = create<SessionsState>((set) => ({
  sessions: sessionsMock,

  createSession: (data) => {
    const session: Session = { id: crypto.randomUUID(), ...data }
    set((state) => ({ sessions: [...state.sessions, session] }))
    return session
  },
}))
