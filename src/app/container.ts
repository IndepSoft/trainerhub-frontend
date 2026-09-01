import type { AuthPort } from '@/shared/domain/ports/AuthPort'
import type { TrainerRepository } from '@/shared/domain/ports/TrainerRepository'
import { SupabaseAuthAdapter } from '@/shared/infrastructure/supabase/SupabaseAuthAdapter'
import { SupabaseTrainerRepository } from '@/shared/infrastructure/supabase/SupabaseTrainerRepository'
import { FakeAuthAdapter } from '@/shared/infrastructure/fake/FakeAuthAdapter'
import { FakeTrainerRepository } from '@/shared/infrastructure/fake/FakeTrainerRepository'
import type { StudentRepository } from '@/shared/domain/ports/StudentRepository'
import { FakeStudentRepository } from '@/shared/infrastructure/fake/FakeStudentRepository'
import type { RoutineRepository } from '@/shared/domain/ports/RoutineRepository'
import { FakeRoutineRepository } from '@/shared/infrastructure/fake/FakeRoutineRepository'
import type { SessionRepository } from '@/shared/domain/ports/SessionRepository'
import { FakeSessionRepository } from '@/shared/infrastructure/fake/FakeSessionRepository'
import type { PlanRepository } from '@/shared/domain/ports/PlanRepository'
import { FakePlanRepository } from '@/shared/infrastructure/fake/FakePlanRepository'
import type { AssignmentRepository } from '@/shared/domain/ports/AssignmentRepository'
import { FakeAssignmentRepository } from '@/shared/infrastructure/fake/FakeAssignmentRepository'
import type { ExerciseRepository } from '@/shared/domain/ports/ExerciseRepository'
import { FakeExerciseRepository } from '@/shared/infrastructure/fake/FakeExerciseRepository'

/**
 * Raíz de composición.
 *
 * Este es el único fichero de la aplicación que nombra una implementación
 * concreta. Migrar a un backend propio consiste en escribir los adaptadores
 * nuevos y cambiar estas líneas; ni un hook ni un componente se entera.
 *
 * Los consumidores importan `container` y tipan contra los puertos, nunca
 * contra las clases `Supabase*` o `Fake*`.
 */
export interface Container {
  auth: AuthPort
  trainers: TrainerRepository
  students: StudentRepository
  routines: RoutineRepository
  sessions: SessionRepository
  plans: PlanRepository
  assignments: AssignmentRepository
  exercises: ExerciseRepository
}

/**
 * La autenticación simulada exige las dos condiciones a la vez.
 *
 * `import.meta.env.DEV` lo reemplaza Vite estáticamente por `false` al compilar
 * para producción, así que la rama entera —y con ella `FakeAuthAdapter`— se
 * elimina del bundle por tree-shaking. El flag explícito evita además que se
 * active por descuido en desarrollo.
 */
const shouldUseFakeAuthentication =
  import.meta.env.DEV && import.meta.env.VITE_USE_FAKE_AUTH === 'true'

function createAuthenticationAdapter(): AuthPort {
  if (shouldUseFakeAuthentication) {
    return new FakeAuthAdapter()
  }
  return new SupabaseAuthAdapter()
}

/**
 * Los entrenadores van con la autenticación, no aparte.
 *
 * La misma condición decide los dos porque desparejarlos no tiene sentido: el
 * identificador de perfil que inventa la autenticación simulada no existe en
 * ninguna tabla real, así que un entrenador de Supabase sobre una sesión falsa
 * no encuentra nunca su ficha.
 */
function createTrainerRepository(): TrainerRepository {
  if (shouldUseFakeAuthentication) {
    return new FakeTrainerRepository()
  }
  return new SupabaseTrainerRepository()
}

export const container: Container = {
  auth: createAuthenticationAdapter(),
  trainers: createTrainerRepository(),
  // TODO: sustituir por los repositorios reales cuando existan las tablas. Son
  // los unicos adaptadores falsos que siguen activos en produccion.
  students: new FakeStudentRepository(),
  routines: new FakeRoutineRepository(),
  sessions: new FakeSessionRepository(),
  plans: new FakePlanRepository(),
  assignments: new FakeAssignmentRepository(),
  exercises: new FakeExerciseRepository(),
}
