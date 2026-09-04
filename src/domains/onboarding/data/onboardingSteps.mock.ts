import { CalendarCheck, Flame, LineChart, Users } from 'lucide-react'
import type { OnboardingStep } from '../types/onboarding.types'

/**
 * Pasos del onboarding.
 *
 * Cuatro y no mas: pasado ese punto la gente empieza a saltarselo, y cada paso
 * extra que no aporte convierte el resto en ruido.
 *
 * SON CLAVES, no textos. La lista es una constante de modulo: se evalua al
 * importar, donde todavia no hay idioma que consultar. El titular llega partido
 * en tres claves y no en una porque se pinta palabra a palabra, cada una con su
 * peso; una sola cadena partida por espacios se rompe en cuanto un idioma use
 * otro numero de palabras.
 *
 * TODO: el copy es una propuesta. Producto debe revisarlo, sobre todo el
 * primer titular, que es lo unico que mucha gente va a leer.
 */
export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    eyebrowKey: 'onboarding.welcome.eyebrow',
    headlineKeys: [
      'onboarding.welcome.headline1',
      'onboarding.welcome.headline2',
      'onboarding.welcome.headline3',
    ],
    bodyKey: 'onboarding.welcome.body',
    icon: Users,
  },
  {
    id: 'schedule',
    eyebrowKey: 'onboarding.schedule.eyebrow',
    headlineKeys: [
      'onboarding.schedule.headline1',
      'onboarding.schedule.headline2',
      'onboarding.schedule.headline3',
    ],
    bodyKey: 'onboarding.schedule.body',
    icon: CalendarCheck,
  },
  {
    id: 'progress',
    eyebrowKey: 'onboarding.progress.eyebrow',
    headlineKeys: [
      'onboarding.progress.headline1',
      'onboarding.progress.headline2',
      'onboarding.progress.headline3',
    ],
    bodyKey: 'onboarding.progress.body',
    icon: LineChart,
  },
  {
    id: 'start',
    eyebrowKey: 'onboarding.start.eyebrow',
    headlineKeys: [
      'onboarding.start.headline1',
      'onboarding.start.headline2',
      'onboarding.start.headline3',
    ],
    bodyKey: 'onboarding.start.body',
    icon: Flame,
  },
]

/** Clave de la preferencia local que recuerda que ya se vio. */
export const ONBOARDING_SEEN_KEY = 'trainerhub.onboarding.visto'
