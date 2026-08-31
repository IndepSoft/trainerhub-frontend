import type { Routine } from '../types/training.types'

/**
 * Rutinas simuladas, ya en la estructura de bloques.
 *
 * Ya no llevan `durationMinutes`: se calcula con `estimateRoutineMinutes`. Un
 * dato derivado que se almacena miente en cuanto alguien edita un bloque y
 * olvida actualizarlo.
 *
 * Tampoco llevan `levelColor`, que ademas se aplicaba con
 * `hover:${routine.levelColor}`: interpolacion que Tailwind no ve al compilar,
 * asi que esa clase nunca llego a generarse y el hover no hacia nada.
 *
 * Ya no se lee desde los hooks: es la SEMILLA de `stores/routinesStore.ts`, que
 * es quien sirve la coleccion y admite altas. Leerla directamente desde un hook
 * dejaba la lista sin enterarse de las rutinas creadas en la sesion.
 *
 * TODO: sustituir por el repositorio cuando exista el esquema. El puerto no
 * nace en `shared/domain/ports` hasta que `Routine` cruce a un segundo dominio
 * -hoy solo la usa `trainings`-; el porque esta razonado en el almacen.
 */
export const routinesMock: Routine[] = [
  {
    id: 'routine-1',
    title: 'Full body · Principiante',
    description: 'Base de fuerza con los patrones fundamentales.',
    level: 'Principiante',
    blocks: [
      {
        id: 'block-1-1',
        method: 'simple',
        restAfterSeconds: 90,
        exercises: [
          {
            id: 'prescribed-1-1',
            exerciseId: 'sentadilla-barra',
            sets: 3,
            reps: '8-10',
            rir: 3,
            restSeconds: 90,
          },
        ],
      },
      {
        id: 'block-1-2',
        method: 'simple',
        restAfterSeconds: 90,
        exercises: [
          {
            id: 'prescribed-1-2',
            exerciseId: 'press-banca-barra',
            sets: 3,
            reps: '8-10',
            rir: 3,
            restSeconds: 90,
          },
        ],
      },
      {
        id: 'block-1-3',
        method: 'simple',
        restAfterSeconds: 90,
        exercises: [
          {
            id: 'prescribed-1-3',
            exerciseId: 'remo-barra',
            sets: 3,
            reps: '10-12',
            rir: 3,
            restSeconds: 90,
          },
        ],
      },
      {
        id: 'block-1-4',
        method: 'simple',
        restAfterSeconds: 60,
        exercises: [
          {
            id: 'prescribed-1-4',
            exerciseId: 'plancha',
            sets: 3,
            reps: '30',
            restSeconds: 45,
            notes: 'Segundos, no repeticiones.',
          },
        ],
      },
    ],
  },
  {
    id: 'routine-2',
    title: 'Empuje · Intermedio',
    description: 'Pectoral, deltoides y tríceps con densidad alta al final.',
    level: 'Intermedio',
    blocks: [
      {
        id: 'block-2-1',
        method: 'simple',
        restAfterSeconds: 120,
        exercises: [
          {
            id: 'prescribed-2-1',
            exerciseId: 'press-banca-barra',
            sets: 4,
            reps: '6-8',
            rir: 2,
            restSeconds: 120,
            tempo: '3-1-1-0',
          },
        ],
      },
      {
        id: 'block-2-2',
        method: 'simple',
        restAfterSeconds: 90,
        exercises: [
          {
            id: 'prescribed-2-2',
            exerciseId: 'press-militar-barra',
            sets: 4,
            reps: '8-10',
            rir: 2,
            restSeconds: 90,
          },
        ],
      },
      {
        id: 'block-2-3',
        method: 'superserie',
        restAfterSeconds: 75,
        notes: 'Sin descanso entre los dos ejercicios.',
        exercises: [
          {
            id: 'prescribed-2-3',
            exerciseId: 'press-inclinado-mancuernas',
            sets: 3,
            reps: '10-12',
            rir: 1,
            restSeconds: 0,
          },
          {
            id: 'prescribed-2-4',
            exerciseId: 'extension-triceps-polea',
            sets: 3,
            reps: '12-15',
            rir: 1,
            restSeconds: 0,
          },
        ],
      },
    ],
  },

  {
    id: 'routine-3',
    title: 'Torso · Empuje y tracción',
    description: 'Empuje pesado y una superserie de tracción para cerrar.',
    level: 'Intermedio',
    blocks: [
      {
        id: 'block-3-1',
        method: 'simple',
        restAfterSeconds: 120,
        exercises: [
          {
            id: 'prescribed-3-1',
            exerciseId: 'press-banca-barra',
            sets: 4,
            reps: '6-8',
            rir: 2,
            restSeconds: 120,
          },
        ],
      },
      {
        id: 'block-3-2',
        method: 'superserie',
        restAfterSeconds: 90,
        exercises: [
          {
            id: 'prescribed-3-2',
            exerciseId: 'jalon-polea',
            sets: 3,
            reps: '10-12',
            rir: 2,
            restSeconds: 0,
          },
          {
            id: 'prescribed-3-3',
            exerciseId: 'curl-biceps-mancuernas',
            sets: 3,
            reps: '12',
            rir: 1,
            restSeconds: 0,
          },
        ],
      },
    ],
  },
]
