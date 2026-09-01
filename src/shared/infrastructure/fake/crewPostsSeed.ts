import type { CrewPost } from '@/shared/domain/entities/crewPost'
import { DEV_CREW_ID } from './crewsSeed'
import { DEV_TRAINER_PROFILE_ID } from './devIdentity'

const now = Date.now()
const HOUR = 60 * 60 * 1000

/** Un instante relativo a ahora, para que la semilla no envejezca. */
function hoursAgo(hours: number): string {
  return new Date(now - hours * HOUR).toISOString()
}

/**
 * Anuncios simulados del muro.
 *
 * Relativos a ahora, como el resto de semillas con fecha: escritos a fuego, el
 * muro diría «hace 8 meses» a los dos días de escribirlos y no habría forma de
 * comprobar que el tiempo relativo se pinta bien.
 *
 * Uno con «me gusta» y otro sin ninguno, a propósito: el estado vacío del
 * contador es el que más fácil se rompe y el que nadie mira al probar.
 *
 * TODO: sustituir por el adaptador real cuando exista el esquema.
 */
export const crewPostsSeed: CrewPost[] = [
  {
    id: 'post-1',
    crewId: DEV_CREW_ID,
    authorProfileId: DEV_TRAINER_PROFILE_ID,
    body: 'El sábado hacemos la salida larga por el cerro. Salimos a las 8:00 del gimnasio, llevad agua para hora y media.',
    createdAt: hoursAgo(5),
    likedBy: [],
  },
  {
    id: 'post-2',
    crewId: DEV_CREW_ID,
    authorProfileId: DEV_TRAINER_PROFILE_ID,
    body: 'Recordad que esta semana toca descarga: bajad la carga un 40 % y centraos en la técnica. Descansar también es entrenar.',
    createdAt: hoursAgo(52),
    likedBy: [],
  },
]
