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
import type { CrewRepository } from '@/shared/domain/ports/CrewRepository'
import { FakeCrewRepository } from '@/shared/infrastructure/fake/FakeCrewRepository'
import type { PlatformRepository } from '@/shared/domain/ports/PlatformRepository'
import { FakePlatformRepository } from '@/shared/infrastructure/fake/FakePlatformRepository'
import type { CrewPostRepository } from '@/shared/domain/ports/CrewPostRepository'
import { FakeCrewPostRepository } from '@/shared/infrastructure/fake/FakeCrewPostRepository'
import type { CrewProgressRepository } from '@/shared/domain/ports/CrewProgressRepository'
import { FakeCrewProgressRepository } from '@/shared/infrastructure/fake/FakeCrewProgressRepository'
import type { CrewStaffRepository } from '@/shared/domain/ports/CrewStaffRepository'
import { FakeCrewStaffRepository } from '@/shared/infrastructure/fake/FakeCrewStaffRepository'
import type { SubscriptionRepository } from '@/shared/domain/ports/SubscriptionRepository'
import { FakeSubscriptionRepository } from '@/shared/infrastructure/fake/FakeSubscriptionRepository'
import type { NoticeRepository } from '@/shared/domain/ports/NoticeRepository'
import { FakeNoticeRepository } from '@/shared/infrastructure/fake/FakeNoticeRepository'
import { crewScope } from './crewScope'

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
  crews: CrewRepository
  crewStaff: CrewStaffRepository
  crewPosts: CrewPostRepository
  subscriptions: SubscriptionRepository
  notices: NoticeRepository
  crewProgress: CrewProgressRepository
  platform: PlatformRepository
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

/**
 * Los entrenadores van con la autenticación, no aparte.
 *
 * La misma condición decide los dos porque desparejarlos no tiene sentido: el
 * identificador de perfil que inventa la autenticación simulada no existe en
 * ninguna tabla real, así que un entrenador de Supabase sobre una sesión falsa
 * no encuentra nunca su ficha.
 *
 * Se guarda la CLASE CONCRETA y no sólo el puerto porque la simulación necesita
 * algo que el puerto ya no ofrece: crear la ficha. Ver justo debajo.
 */
const fakeTrainers = shouldUseFakeAuthentication ? new FakeTrainerRepository() : null

/**
 * La cuenta y su ficha nacen juntas, también en la simulación.
 *
 * En Supabase lo hace un disparador sobre `auth.users`, dentro de la misma
 * transacción; aquí lo hace esta función, que es lo más parecido que hay. Y va
 * en la raíz de composición porque es el único sitio que puede saber a la vez
 * que existe una autenticación simulada y que existen fichas de entrenador: el
 * adaptador de autenticación no debe saberlo, y el de fichas no sabe de altas.
 *
 * SÓLO PARA QUIEN VIENE A ENTRENAR A OTROS. Un alumno no tiene ficha de
 * entrenador, y dársela le mandaría a fundar un equipo que no ha pedido.
 */
function createAuthenticationAdapter(): AuthPort {
  if (fakeTrainers === null) return new SupabaseAuthAdapter()

  return new FakeAuthAdapter(async (user, profile) => {
    if (profile.intent !== 'trainer') return

    await fakeTrainers.create({
      profileId: user.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: user.email,
      // La experiencia llega como rango -«1-3 años»- y se guarda como número:
      // en blanco se queda sin poner, no en cero, que afirmaría algo que nadie
      // ha dicho.
      yearsExperience: Number.parseInt(profile.yearsOfExperience ?? '', 10) || undefined,
    })
  })
}

/*
 * La plataforma se compone aparte porque necesita las CLASES CONCRETAS de crews
 * y alumnos: mira por encima del ambito de un crew, y los puertos no ofrecen eso
 * a proposito. Juntarlas es exactamente el trabajo de la raiz de composicion, y
 * el unico sitio donde puede ocurrir sin que nadie mas se entere.
 */
const fakeCrews = new FakeCrewRepository()
const fakeStudents = new FakeStudentRepository(crewScope)
const fakeSessions = new FakeSessionRepository(crewScope)
const fakeCrewStaff = new FakeCrewStaffRepository(crewScope)
const trainers: TrainerRepository = fakeTrainers ?? new SupabaseTrainerRepository()

export const container: Container = {
  auth: createAuthenticationAdapter(),
  crews: fakeCrews,
  crewStaff: fakeCrewStaff,
  crewPosts: new FakeCrewPostRepository(crewScope),
  subscriptions: new FakeSubscriptionRepository(crewScope),
  notices: new FakeNoticeRepository(crewScope),
  /*
   * El ranking recibe las clases concretas: necesita las sesiones de TODO el
   * equipo, y el ambito de un alumno le deja ver solo las suyas. Lo que sale de
   * aqui es un agregado, no las sesiones de nadie.
   */
  crewProgress: new FakeCrewProgressRepository(fakeSessions, fakeStudents, crewScope),
  platform: new FakePlatformRepository(fakeCrews, fakeStudents, fakeCrewStaff, trainers),
  trainers,
  /*
   * TODO: sustituir por los repositorios reales cuando existan las tablas. Son
   * los unicos adaptadores falsos que siguen activos en produccion.
   *
   * EL AMBITO DEL CREW SE INYECTA AQUI, en la raiz de composicion, que es el
   * unico sitio que puede saber a la vez quien lo provee y quien lo consume. Los
   * puertos no lo mencionan y los hooks no lo conocen: `students.findAll()`
   * sigue significando «los alumnos», y lo que cambia es quien los sirve.
   *
   * Con un backend real esto desaparece: el crew activo viaja en la sesion y
   * filtra Postgres con RLS, no el cliente.
   */
  students: fakeStudents,
  routines: new FakeRoutineRepository(crewScope),
  sessions: fakeSessions,
  plans: new FakePlanRepository(crewScope),
  assignments: new FakeAssignmentRepository(crewScope),
  exercises: new FakeExerciseRepository(),
}
