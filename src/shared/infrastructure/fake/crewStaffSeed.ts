import type { CrewStaff } from '@/shared/domain/entities/crew'
import { DEV_CREW_ID, TEST_CREW_ID } from './crewsSeed'
import { DEV_ADMIN_EMAIL } from './platformAdminsSeed'
import { DEV_TRAINER_EMAIL, DEV_TRAINER_PROFILE_ID, profileIdFromEmail } from './devIdentity'

/** Un segundo entrenador, para que el caso del gimnasio exista en desarrollo. */
export const DEV_SECOND_TRAINER_EMAIL = 'lucia@indepsoft.com'

/**
 * El equipo técnico simulado.
 *
 * TRES PUESTOS, Y CADA UNO PRUEBA UNA COSA:
 *
 *  - Marco es `admin` de Hierro y Asfalto: lo fundó, así que gobierna y entrena.
 *    Es el caso corriente, en el que la distinción entre administrador y
 *    entrenador no se nota porque la misma persona es las dos cosas.
 *  - Lucía es `trainer` del mismo crew: entrena igual que Marco pero no toca
 *    los ajustes ni decide quién trabaja allí. Es el caso del gimnasio.
 *  - El administrador de plataforma es `admin` de su propio equipo de pruebas, y
 *    de NINGÚN otro. Ahí es donde ve todos los módulos con datos suyos.
 *
 * Lucía trae además una concesión suelta —los ajustes del equipo— porque el
 * caso intermedio hay que poder verlo: prestarle una llave a alguien sin
 * ascenderlo.
 *
 * TODO: sustituir por el adaptador real cuando exista el esquema.
 */
export const crewStaffSeed: CrewStaff[] = [
  {
    id: 'staff-1',
    crewId: DEV_CREW_ID,
    profileId: DEV_TRAINER_PROFILE_ID,
    role: 'admin',
    extraCapabilities: [],
    displayName: 'Marco Salas',
    email: DEV_TRAINER_EMAIL,
  },
  {
    id: 'staff-2',
    crewId: DEV_CREW_ID,
    profileId: profileIdFromEmail(DEV_SECOND_TRAINER_EMAIL),
    role: 'trainer',
    extraCapabilities: ['crew.settings'],
    displayName: 'Lucía Ferrer',
    email: DEV_SECOND_TRAINER_EMAIL,
  },
  {
    id: 'staff-3',
    crewId: TEST_CREW_ID,
    profileId: profileIdFromEmail(DEV_ADMIN_EMAIL),
    role: 'admin',
    extraCapabilities: [],
    displayName: 'Sara Ibáñez',
    email: DEV_ADMIN_EMAIL,
  },
]
