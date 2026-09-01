import { createContext, useContext } from 'react'
import type { ViewerPerson } from './hooks/useViewer'
import type { CrewRole, Membership } from '@/shared/domain/entities/crew'
import type { Trainer } from '@/shared/domain/entities/trainer'

/**
 * Lo que cualquier pantalla puede preguntar sobre quién está delante.
 *
 * Es un subconjunto de lo que devuelve `useViewer`: se comparte lo que hace
 * falta y no el hook entero, para que una página no pueda provocar una recarga
 * de las pertenencias por su cuenta.
 */
export interface ViewerContextValue {
  trainer: Trainer | null
  person: ViewerPerson
  memberships: Membership[]
  pending: Membership[]
  active: Membership | null
  role: CrewRole | null
  canManage: boolean
  isPlatformAdmin: boolean
  loading: boolean
  selectCrew: (crewId: string) => void
}

/**
 * Quién ha entrado, resuelto una sola vez.
 *
 * POR CONTEXTO Y NO LLAMANDO AL HOOK EN CADA PÁGINA. `useViewer` consulta tres
 * repositorios y resuelve un crew por cada ficha de alumno; hacerlo en el layout
 * y otra vez en la página del crew serían dos rondas completas para pintar una
 * pantalla, y además podrían discrepar durante un instante.
 *
 * El valor por defecto es el de «todavía cargando» a propósito: si algún día se
 * monta un consumidor fuera del proveedor, se comportará como una pantalla que
 * espera datos, que es inofensivo, en vez de afirmar que no hay nadie.
 */
export const ViewerContext = createContext<ViewerContextValue>({
  trainer: null,
  person: {},
  memberships: [],
  pending: [],
  active: null,
  role: null,
  canManage: false,
  isPlatformAdmin: false,
  loading: true,
  selectCrew: () => undefined,
})

export function useViewerContext(): ViewerContextValue {
  return useContext(ViewerContext)
}
