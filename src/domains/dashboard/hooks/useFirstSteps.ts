import { useEffect, useState } from 'react'
import { container } from '@/app/container'
import type { Crew } from '@/shared/domain/entities/crew'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'

/** Un paso del arranque: qué es, si está hecho, y a dónde se va a hacerlo. */
export interface FirstStep {
  id: 'crew' | 'activation' | 'routine' | 'student' | 'session'
  labelKey: TranslationKey
  done: boolean
  /** Un matiz bajo el paso: «pedida, esperando a la plataforma». */
  noteKey?: TranslationKey
  to: string
}

interface UseFirstStepsResult {
  steps: FirstStep[]
  /** Falso en cuanto todo está hecho: la lista desaparece. */
  hasPending: boolean
  loading: boolean
}

/**
 * Los primeros pasos de un equipo, en el orden en que dependen unos de otros.
 *
 * La secuencia real —equipo, activación, rutina, alumno, sesión— existía en el
 * código y en ningún sitio de la interfaz: cada pieza era alcanzable desde el
 * menú y ninguna decía qué va antes. Esto la enseña mientras falte algo, con
 * lecturas que ya existían, y se quita sola cuando está todo: no es un
 * tutorial, es la lista de lo que falta.
 */
export function useFirstSteps(crew: Crew | null): UseFirstStepsResult {
  const [counts, setCounts] = useState<{ routines: number; students: number; sessions: number } | null>(null)

  useEffect(() => {
    if (crew === null) return
    let active = true

    const load = () => {
      void Promise.all([
        container.routines.findAll(),
        container.students.findAll(),
        container.sessions.findAll(),
      ])
        .then(([routines, students, sessions]) => {
          if (active) setCounts({ routines: routines.length, students: students.length, sessions: sessions.length })
        })
        .catch(() => undefined)
    }

    load()
    const unsubscribes = [
      container.routines.onChange(load),
      container.students.onChange(load),
      container.sessions.onChange(load),
    ]
    return () => {
      active = false
      for (const unsubscribe of unsubscribes) unsubscribe()
    }
  }, [crew])

  if (crew === null || counts === null) return { steps: [], hasPending: false, loading: true }

  const activationRequested = crew.subscriptionStatus === 'pending' && crew.activationRequestedAt !== null
  const steps: FirstStep[] = [
    { id: 'crew', labelKey: 'firstSteps.crew', done: true, to: '/crew' },
    {
      id: 'activation',
      labelKey: 'firstSteps.activation',
      done: crew.subscriptionStatus === 'active',
      noteKey: activationRequested ? 'firstSteps.activationPending' : undefined,
      to: '/crew',
    },
    { id: 'routine', labelKey: 'firstSteps.routine', done: counts.routines > 0, to: '/trainings/new' },
    { id: 'student', labelKey: 'firstSteps.student', done: counts.students > 0, to: '/students' },
    { id: 'session', labelKey: 'firstSteps.session', done: counts.sessions > 0, to: '/calendar' },
  ]

  return { steps, hasPending: steps.some((step) => !step.done), loading: false }
}
