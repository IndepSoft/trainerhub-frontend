import { CalendarCheck, Flame, LineChart, Users } from 'lucide-react'
import type { OnboardingStep } from '../types/onboarding.types'

/**
 * Pasos del onboarding.
 *
 * Cuatro y no más: pasado ese punto la gente empieza a saltárselo, y cada paso
 * extra que no aporte convierte el resto en ruido.
 *
 * TODO: el copy es una propuesta. Producto debe revisarlo, sobre todo el
 * primer titular, que es lo unico que mucha gente va a leer.
 */
export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    eyebrow: 'Bienvenido',
    headline: ['Tus', 'estudiantes,', 'en un sitio'],
    body: 'Deja de perseguir horarios por WhatsApp. Todo tu equipo, sus sesiones y su progreso, en una sola pantalla.',
    icon: Users,
  },
  {
    id: 'schedule',
    eyebrow: 'Agenda',
    headline: ['Programa', 'una vez.', 'Ya está'],
    body: 'Crea la sesión, confirma y olvídate. El calendario avisa a quien tiene que aparecer.',
    icon: CalendarCheck,
  },
  {
    id: 'progress',
    eyebrow: 'Progreso',
    headline: ['Lo que', 'no se mide', 'no mejora'],
    body: 'Rachas, hitos y métricas reales. Tus estudiantes ven cuánto han avanzado, y vuelven.',
    icon: LineChart,
  },
  {
    id: 'start',
    eyebrow: 'Empezamos',
    headline: ['Hoy', 'es', 'el día 1'],
    body: 'La primera racha empieza con una sesión. Vamos a por ella.',
    icon: Flame,
  },
]

/** Clave de la preferencia local que recuerda que ya se vio. */
export const ONBOARDING_SEEN_KEY = 'trainerhub.onboarding.visto'
