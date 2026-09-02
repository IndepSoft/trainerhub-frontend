import type { Crew } from '@/shared/domain/entities/crew'
import { profileIdFromEmail, DEV_TRAINER_PROFILE_ID } from './devIdentity'
import { DEV_ADMIN_EMAIL } from './platformAdminsSeed'

/** El crew de ejemplo. Todo lo demás de las semillas le pertenece. */
export const DEV_CREW_ID = 'crew-1'

/** El equipo del administrador de plataforma. El único al que entra. */
export const TEST_CREW_ID = 'crew-test'

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
    // Activo: es el equipo con el que se trabaja en desarrollo, y dejarlo
    // pendiente obligaria a entrar como administrador antes de poder hacer
    // nada. Los que se crean desde la aplicacion SI nacen pendientes.
    subscriptionStatus: 'active',
  },
  {
    /*
     * EL EQUIPO PROPIO DEL ADMINISTRADOR DE PLATAFORMA.
     *
     * Existe porque administrar la plataforma y entrenar son dos cosas
     * distintas, y quien hace lo primero también necesita ver la aplicación
     * funcionando. Antes entraba en los equipos de sus clientes para eso; ahora
     * tiene el suyo, y los de los demás son privados.
     */
    id: TEST_CREW_ID,
    name: 'CREWTEST',
    denomination: 'Crew',
    ownerId: profileIdFromEmail(DEV_ADMIN_EMAIL),
    joinToken: 'CREWTEST',
    requiresApproval: true,
    rankingEnabled: true,
    subscriptionStatus: 'active',
  },
]
