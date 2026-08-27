import type { Student } from '../types/student.types'

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
 * TODO: sustituir por un `StudentRepository` -puerto en `shared/domain/ports`,
 * adaptador en `shared/infrastructure`- cuando exista el esquema. `useStudents`
 * es el unico punto que habra que tocar.
 */
export const studentsMock: Student[] = [
  {
    id: 'student-1',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'jperez@gmail.com',
    level: 'Intermedio',
    goals: ['Perder peso', 'Ganar músculo'],
    age: 28,
    bodyFatPercentage: 22,
  },
  {
    id: 'student-2',
    firstName: 'María',
    lastName: 'Gómez',
    email: 'mgomez@gmail.com',
    level: 'Avanzado',
    goals: ['Mejorar resistencia'],
    age: 34,
    bodyFatPercentage: 18,
  },
  {
    id: 'student-3',
    firstName: 'Carlos',
    lastName: 'López',
    email: 'clopez@gmail.com',
    level: 'Principiante',
    goals: ['Tonificar'],
    age: 41,
    bodyFatPercentage: 27,
  },
  {
    id: 'student-4',
    firstName: 'Ana',
    lastName: 'Torres',
    email: 'atorrez@gmail.com',
    level: 'Intermedio',
    goals: ['Perder peso'],
    age: 25,
    bodyFatPercentage: 24,
  },
]
