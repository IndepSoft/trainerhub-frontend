import type { AuthPort } from '@/shared/domain/ports/AuthPort'
import type { TrainerRepository } from '@/shared/domain/ports/TrainerRepository'
import { SupabaseAuthAdapter } from '@/shared/infrastructure/supabase/SupabaseAuthAdapter'
import { SupabaseTrainerRepository } from '@/shared/infrastructure/supabase/SupabaseTrainerRepository'
import { SupabaseCrewRepository } from '@/shared/infrastructure/supabase/SupabaseCrewRepository'
import { SupabaseCrewStaffRepository } from '@/shared/infrastructure/supabase/SupabaseCrewStaffRepository'
import { SupabaseStudentRepository } from '@/shared/infrastructure/supabase/SupabaseStudentRepository'
import { SupabaseSubscriptionRepository } from '@/shared/infrastructure/supabase/SupabaseSubscriptionRepository'
import { SupabaseNoticeRepository } from '@/shared/infrastructure/supabase/SupabaseNoticeRepository'
import { SupabasePlatformRepository } from '@/shared/infrastructure/supabase/SupabasePlatformRepository'
import { SupabaseRoutineRepository } from '@/shared/infrastructure/supabase/SupabaseRoutineRepository'
import { SupabasePlanRepository } from '@/shared/infrastructure/supabase/SupabasePlanRepository'
import { SupabaseAssignmentRepository } from '@/shared/infrastructure/supabase/SupabaseAssignmentRepository'
import { SupabaseExerciseRepository } from '@/shared/infrastructure/supabase/SupabaseExerciseRepository'
import { SupabaseCatalogRepository } from '@/shared/infrastructure/supabase/SupabaseCatalogRepository'
import { SupabaseBlockLibraryRepository } from '@/shared/infrastructure/supabase/SupabaseBlockLibraryRepository'
import { SupabaseSessionRepository } from '@/shared/infrastructure/supabase/SupabaseSessionRepository'
import { SupabaseCrewPostRepository } from '@/shared/infrastructure/supabase/SupabaseCrewPostRepository'
import { SupabaseScoreRepository } from '@/shared/infrastructure/supabase/SupabaseScoreRepository'
import { SupabaseBadgeRepository } from '@/shared/infrastructure/supabase/SupabaseBadgeRepository'
import type { CatalogRepository } from '@/shared/domain/ports/CatalogRepository'
import { FakeCatalogRepository } from '@/shared/infrastructure/fake/FakeCatalogRepository'
import type { BlockLibraryRepository } from '@/shared/domain/ports/BlockLibraryRepository'
import { FakeBlockLibraryRepository } from '@/shared/infrastructure/fake/FakeBlockLibraryRepository'
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
import type { ScoreRepository } from '@/shared/domain/ports/ScoreRepository'
import type { BadgeRepository } from '@/shared/domain/ports/BadgeRepository'
import { FakeScoreRepository } from '@/shared/infrastructure/fake/FakeScoreRepository'
import { FakeBadgeRepository } from '@/shared/infrastructure/fake/FakeBadgeRepository'
import { FakeRouteRepository } from '@/shared/infrastructure/fake/FakeRouteRepository'
import { FakeStreakRepository } from '@/shared/infrastructure/fake/FakeStreakRepository'
import type { StreakRepository } from '@/shared/domain/ports/StreakRepository'
import { SupabaseStreakRepository } from '@/shared/infrastructure/supabase/SupabaseStreakRepository'
import type { RouteRepository } from '@/shared/domain/ports/RouteRepository'
import { SupabaseRouteRepository } from '@/shared/infrastructure/supabase/SupabaseRouteRepository'
import type { CrewStaffRepository } from '@/shared/domain/ports/CrewStaffRepository'
import { FakeCrewStaffRepository } from '@/shared/infrastructure/fake/FakeCrewStaffRepository'
import type { SubscriptionRepository } from '@/shared/domain/ports/SubscriptionRepository'
import { FakeSubscriptionRepository } from '@/shared/infrastructure/fake/FakeSubscriptionRepository'
import type { NoticeRepository } from '@/shared/domain/ports/NoticeRepository'
import { FakeNoticeRepository } from '@/shared/infrastructure/fake/FakeNoticeRepository'
import type { OnboardingRepository } from '@/shared/domain/ports/OnboardingRepository'
import { FakeOnboardingRepository } from '@/shared/infrastructure/fake/FakeOnboardingRepository'
import { SupabaseOnboardingRepository } from '@/shared/infrastructure/supabase/SupabaseOnboardingRepository'
import type { PhotoStorage } from '@/shared/domain/ports/PhotoStorage'
import { FakePhotoStorage } from '@/shared/infrastructure/fake/FakePhotoStorage'
import { SupabasePhotoStorage } from '@/shared/infrastructure/supabase/SupabasePhotoStorage'
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
  /** La puntuacion de cada sesion y el agregado del equipo. La escribe el servidor. */
  scores: ScoreRepository
  /** Las insignias conseguidas. Las desbloquea el servidor al cerrar la sesion. */
  badges: BadgeRepository
  /** Las rutas de desarrollo: donde esta cada alumno, y la mano del entrenador. */
  routes: RouteRepository
  /** Las pausas de racha y los comodines. */
  streaks: StreakRepository
  platform: PlatformRepository
  trainers: TrainerRepository
  students: StudentRepository
  routines: RoutineRepository
  sessions: SessionRepository
  plans: PlanRepository
  assignments: AssignmentRepository
  exercises: ExerciseRepository
  /**
   * Los dos puertos que no existian. El catalogo y la biblioteca vivian en
   * almacenes de `zustand` sin adaptador, y lo que el entrenador anadia se
   * perdia al recargar. Plan, §5.
   */
  catalog: CatalogRepository
  blockLibrary: BlockLibraryRepository
  /** Si quien ha entrado ya vio la bienvenida. De la cuenta, no del dispositivo. */
  onboarding: OnboardingRepository
  /** Las fotos. Primer puerto que guarda ficheros. */
  photos: PhotoStorage
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
const fakeCrewStaff = new FakeCrewStaffRepository(crewScope)
/*
 * El equipo simulado sienta a su fundador al nacer, como hace `create_crew`.
 * La raiz de composicion es quien conoce a la vez los dos almacenes; el de
 * equipos solo recibe «que hacer con el fundador».
 */
const fakeCrews = new FakeCrewRepository(async (crewId, founder) => {
  await fakeCrewStaff.addToCrew(crewId, {
    profileId: founder.profileId,
    role: 'admin',
    extraCapabilities: [],
    displayName: founder.displayName,
    email: founder.email,
  })
})
const fakeStudents = new FakeStudentRepository(crewScope)
const fakeSessions = new FakeSessionRepository(crewScope)
const fakePlans = new FakePlanRepository(crewScope)
const fakeAssignments = new FakeAssignmentRepository(crewScope)
// La puntuacion, las insignias y las rutas simuladas se cruzan entre si como
// en la base lo hacen las funciones: se instancian una vez y se comparten.
const fakeScores = new FakeScoreRepository(fakeSessions, fakeStudents, crewScope)
const fakeStreaks = new FakeStreakRepository(fakeSessions)
const fakeBadges = new FakeBadgeRepository(fakeSessions, fakeStudents, fakeStreaks, crewScope)
const trainers: TrainerRepository = fakeTrainers ?? new SupabaseTrainerRepository()

/*
 * FASE 1 DEL PLAN: equipos y puestos van contra Supabase con la misma condicion
 * que la autenticacion. Los fakes se quedan instanciados porque la plataforma y
 * el ranking -todavia simulados- se componen sobre sus clases concretas; hasta
 * la fase 2, el panel de plataforma sigue mirando equipos simulados aunque el
 * resto de la aplicacion vea los reales. Esta escrito en el plan, §4.
 */
const crews: CrewRepository = shouldUseFakeAuthentication ? fakeCrews : new SupabaseCrewRepository()
const crewStaff: CrewStaffRepository = shouldUseFakeAuthentication
  ? fakeCrewStaff
  : new SupabaseCrewStaffRepository(crewScope)

/*
 * FASE 2: alumnos, cuotas, avisos y plataforma. Con la misma condicion. El
 * ranking (`crewProgress`) sigue simulado hasta la fase 5 y se compone sobre
 * los fakes de sesiones y alumnos, que por eso siguen instanciados.
 */
const students: StudentRepository = shouldUseFakeAuthentication
  ? fakeStudents
  : new SupabaseStudentRepository(crewScope)
const subscriptions: SubscriptionRepository = shouldUseFakeAuthentication
  ? new FakeSubscriptionRepository(crewScope)
  : new SupabaseSubscriptionRepository(crewScope)
const notices: NoticeRepository = shouldUseFakeAuthentication
  ? new FakeNoticeRepository(crewScope)
  : new SupabaseNoticeRepository(crewScope)
const platform: PlatformRepository = shouldUseFakeAuthentication
  ? new FakePlatformRepository(fakeCrews, fakeStudents, fakeCrewStaff, trainers)
  : new SupabasePlatformRepository()

export const container: Container = {
  auth: createAuthenticationAdapter(),
  crews,
  crewStaff,
  /*
   * FASE 5: muro y ranking. El ranking simulado recibe las clases concretas
   * porque necesita las sesiones de TODO el equipo y el ambito de un alumno le
   * deja ver solo las suyas; el real es una funcion del servidor que devuelve
   * agregados, por el mismo motivo pero al otro lado de RLS.
   */
  crewPosts: shouldUseFakeAuthentication
    ? new FakeCrewPostRepository(crewScope)
    : new SupabaseCrewPostRepository(crewScope),
  subscriptions,
  notices,
  scores: shouldUseFakeAuthentication ? fakeScores : new SupabaseScoreRepository(crewScope),
  badges: shouldUseFakeAuthentication ? fakeBadges : new SupabaseBadgeRepository(),
  routes: shouldUseFakeAuthentication
    ? new FakeRouteRepository(fakeSessions, fakeAssignments, fakePlans, fakeScores, fakeBadges)
    : new SupabaseRouteRepository(),
  streaks: shouldUseFakeAuthentication ? fakeStreaks : new SupabaseStreakRepository(),
  platform,
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
  students,
  /*
   * FASE 3: entrenamiento. Rutinas, planes, asignaciones, ejercicios, catalogo
   * y biblioteca, con la misma condicion que la autenticacion. Las sesiones
   * siguen simuladas hasta la fase 4.
   */
  routines: shouldUseFakeAuthentication
    ? new FakeRoutineRepository(crewScope)
    : new SupabaseRoutineRepository(crewScope),
  /*
   * FASE 4: la agenda. `fakeSessions` sigue instanciado porque el ranking
   * simulado se compone sobre el hasta la fase 5.
   */
  sessions: shouldUseFakeAuthentication ? fakeSessions : new SupabaseSessionRepository(crewScope),
  plans: shouldUseFakeAuthentication
    ? fakePlans
    : new SupabasePlanRepository(crewScope),
  assignments: shouldUseFakeAuthentication
    ? fakeAssignments
    : new SupabaseAssignmentRepository(crewScope),
  exercises: shouldUseFakeAuthentication
    ? new FakeExerciseRepository()
    : new SupabaseExerciseRepository(crewScope),
  catalog: shouldUseFakeAuthentication
    ? new FakeCatalogRepository()
    : new SupabaseCatalogRepository(crewScope),
  blockLibrary: shouldUseFakeAuthentication
    ? new FakeBlockLibraryRepository()
    : new SupabaseBlockLibraryRepository(crewScope),
  onboarding: shouldUseFakeAuthentication
    ? new FakeOnboardingRepository()
    : new SupabaseOnboardingRepository(),
  photos: shouldUseFakeAuthentication ? new FakePhotoStorage() : new SupabasePhotoStorage(),
}
