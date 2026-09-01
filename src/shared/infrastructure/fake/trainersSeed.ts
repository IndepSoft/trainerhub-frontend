import type { Trainer } from '@/shared/domain/entities/trainer'
import { DEV_TRAINER_EMAIL, DEV_TRAINER_PROFILE_ID } from './devIdentity'

/**
 * El entrenador de desarrollo.
 *
 * HACÍA FALTA desde que el rol gobierna la aplicación. `FakeTrainerRepository`
 * sólo conocía a quien se hubiera registrado en esta máquina, así que entrar con
 * las credenciales de desarrollo daba una sesión sin ficha: ni entrenador ni
 * alumno, y por tanto sin navegación que pintar.
 *
 * TODO: sustituir por el adaptador real cuando exista el esquema.
 */
export const trainersSeed: Trainer[] = [
  {
    id: 'trainer-1',
    profileId: DEV_TRAINER_PROFILE_ID,
    firstName: 'Marco',
    lastName: 'Salas',
    email: DEV_TRAINER_EMAIL,
    verified: true,
    totalReviews: 0,
    yearsExperience: 8,
  },
]
