import { ROUTE_NODES, type ProgressRouteCode, type RouteProgress } from '@/shared/domain/entities/progress'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'
import type { PathNode } from '../types/gamification.types'

export const ROUTE_NAME_KEY: Record<ProgressRouteCode, TranslationKey> = {
  titan: 'route.titan.name',
  endurance: 'route.endurance.name',
  apex: 'route.apex.name',
  vitality: 'route.vitality.name',
  hybrid: 'route.hybrid.name',
}

export const ROUTE_DESCRIPTION_KEY: Record<ProgressRouteCode, TranslationKey> = {
  titan: 'route.titan.description',
  endurance: 'route.endurance.description',
  apex: 'route.apex.description',
  vitality: 'route.vitality.description',
  hybrid: 'route.hybrid.description',
}

const NODE_TITLE_KEY: Record<number, TranslationKey> = {
  1: 'route.node.initiation',
  2: 'route.node.consolidation',
  3: 'route.node.mastery',
  4: 'route.node.master',
}

const NODE_DESCRIPTION_KEY: Record<number, TranslationKey> = {
  1: 'route.node.initiation.description',
  2: 'route.node.consolidation.description',
  3: 'route.node.mastery.description',
  4: 'route.node.master.description',
}

/**
 * El sendero de cuatro nodos, con el estado de cada uno.
 *
 * Sólo hay un nodo `active`: el siguiente al que se está. Los de más allá
 * quedan `locked` aunque los puntos ya sumen, porque el sendero se lee como un
 * camino y dos puntos brillando a la vez no dice por dónde se va. El nodo en
 * el que se está y los anteriores van `completed`.
 */
export function routePathFrom(progress: RouteProgress): PathNode[] {
  return ROUTE_NODES.map((node): PathNode => {
    const state =
      node.position <= progress.position
        ? 'completed'
        : node.position === progress.position + 1
          ? 'active'
          : 'locked'
    return {
      position: node.position,
      titleKey: NODE_TITLE_KEY[node.position],
      descriptionKey: NODE_DESCRIPTION_KEY[node.position],
      state,
      points: { current: Math.min(progress.points, node.pointsRequired), target: node.pointsRequired },
      weeks: { current: Math.min(progress.adherentWeeks, node.weeksRequired), target: node.weeksRequired },
      validated: node.position === 1 || progress.validatedPositions.includes(node.position),
      needsValidation: node.position > 1,
    }
  })
}

/** El sendero de quien aún no está en ninguna ruta: Hybrid, en el nodo 1, a cero. */
export function emptyRoutePath(): PathNode[] {
  return routePathFrom({
    studentId: '',
    routeCode: 'hybrid',
    position: 1,
    points: 0,
    adherentWeeks: 0,
    validatedPositions: [],
  })
}
