import type { Student } from '@/shared/domain/entities/student'
import { DEV_CREW_ID } from './crewsSeed'

/**
 * Estudiantes simulados.
 *
 * Estaban incrustados en el cuerpo de `Students.tsx`, mezclados con la
 * disposición de la página.
 *
 * Ojo con `age` y `bodyFatPercentage`: antes no venían del dato, estaban
 * escritos a fuego dentro de `StudentCard`, asi que las cuatro tarjetas
 * mostraban "10 años" y "22 %". Ahora cada estudiante tiene los suyos, que es lo
 * que se veria con datos reales.
 *
 * Aqui no hay ninguna clase de Tailwind a proposito: el color de cada nivel es
 * decision de la vista, no del dato. Antes `levelColor` viajaba dentro del
 * estudiante, lo que obligaba a cambiar los datos para cambiar un color.
 *
 * Ninguno tiene cuenta todavia -`profileId` a `null`-, que es el caso corriente:
 * el entrenador da de alta a alguien mucho antes de que esa persona se registre.
 * Por eso estan `invited` y no `active`: la ficha existe y espera a su dueño.
 *
 * Los cuatro pertenecen al crew de ejemplo. Sin `crewId` no los veria nadie: el
 * filtrado por tenant deja fuera lo que no es de ningun crew.
 *
 * TODO: sustituir por el adaptador real cuando exista el esquema.
 */
export const studentsSeed: Student[] = [
  {
    id: 'student-1',
    crewId: DEV_CREW_ID,
    membershipStatus: 'invited',
    extraCapabilities: [],
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'jperez@gmail.com',
    level: 'Intermedio',
    goals: ['Perder peso', 'Ganar músculo'],
    age: 28,
    bodyFatPercentage: 22,
    profileId: null,
  },
  {
    id: 'student-2',
    crewId: DEV_CREW_ID,
    membershipStatus: 'invited',
    extraCapabilities: [],
    firstName: 'María',
    lastName: 'Gómez',
    email: 'mgomez@gmail.com',
    level: 'Avanzado',
    goals: ['Mejorar resistencia'],
    age: 34,
    bodyFatPercentage: 18,
    profileId: null,
  },
  {
    id: 'student-3',
    crewId: DEV_CREW_ID,
    membershipStatus: 'invited',
    extraCapabilities: [],
    firstName: 'Carlos',
    lastName: 'López',
    email: 'clopez@gmail.com',
    level: 'Principiante',
    goals: ['Tonificar'],
    age: 41,
    bodyFatPercentage: 27,
    profileId: null,
  },
  {
    id: 'student-4',
    crewId: DEV_CREW_ID,
    membershipStatus: 'invited',
    extraCapabilities: [],
    firstName: 'Ana',
    lastName: 'Torres',
    email: 'atorrez@gmail.com',
    level: 'Intermedio',
    goals: ['Perder peso'],
    age: 25,
    bodyFatPercentage: 24,
    profileId: null,
  },
]
