import type { Routine } from '../types/training.types'

/**
 * Rutinas simuladas.
 *
 * Estaban en el cuerpo de `Trainings.tsx`, junto a la disposicion de la pagina.
 *
 * Ya no llevan `levelColor`: el color es decision de la vista, no del dato.
 * Ademas la clase se aplicaba con `hover:${routine.levelColor}`, interpolacion
 * que Tailwind no puede ver al compilar, asi que esa clase nunca llego a
 * generarse -comprobado sobre el CSS del build- y el hover no hacia nada.
 *
 * TODO: sustituir por un `RoutineRepository` -puerto en `shared/domain/ports`,
 * adaptador en `shared/infrastructure`- cuando exista el esquema. `useRoutines`
 * es el unico punto que habra que tocar.
 */
export const routinesMock: Routine[] = [
  {
    id: 'routine-1',
    title: 'Rutina Principiante - Cuerpo Completo',
    description: 'Rutina ideal para comenzar con ejercicios básicos',
    level: 'Principiante',
    durationMinutes: 45,
    exercises: [
      { id: 'exercise-1', name: 'Sentadillas', prescription: '3x12' },
      { id: 'exercise-2', name: 'Flexiones', prescription: '3x8' },
      { id: 'exercise-3', name: 'Plancha', prescription: '3x30 seg' },
    ],
  },
]

/**
 * Plantillas de rutina.
 *
 * Vacio a proposito: la pestaña "Plantillas" mostraba "(1)" escrito a mano
 * aunque no existiera ninguna plantilla en el codigo. Ahora el contador sale de
 * aqui y dice la verdad.
 *
 * TODO: no hay modelo de plantillas todavia.
 */
export const routineTemplatesMock: Routine[] = []
