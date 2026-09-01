import type { Crew } from '@/shared/domain/entities/crew'
import { DEV_TRAINER_PROFILE_ID } from './devIdentity'

/** El crew de ejemplo. Todo lo demás de las semillas le pertenece. */
export const DEV_CREW_ID = 'crew-1'

/**
 * Crews simulados.
 *
 * Uno solo, y es el que hace que el resto de la semilla tenga dueño: los cuatro
 * alumnos, sus sesiones y las rutinas son de este crew. Sin él, el filtrado por
 * tenant dejaría la aplicación vacía en desarrollo.
 *
 * El token es fijo a propósito, al revés que los que se generan al crear un
 * crew: así el QR de ejemplo puede probarse sin tener que leerlo de la pantalla
 * cada vez que se recarga.
 *
 * TODO: sustituir por el adaptador real cuando exista el esquema.
 */
export const crewsSeed: Crew[] = [
  {
    id: DEV_CREW_ID,
    name: 'Hierro y Asfalto',
    denomination: 'Crew',
    ownerId: DEV_TRAINER_PROFILE_ID,
    joinToken: 'HIERRO24',
    requiresApproval: true,
    rankingEnabled: true,
  },
]
