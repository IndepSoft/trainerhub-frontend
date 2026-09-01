import { useCallback, useEffect, useState } from 'react'
import { container } from '@/app/container'
import { crewScope, setActiveCrew } from '@/app/crewScope'
import { useAuthStore } from '@/app/stores/authStore'
import { isMember } from '@/shared/domain/entities/crew'
import type { CrewRole, Membership } from '@/shared/domain/entities/crew'
import type { Trainer } from '@/shared/domain/entities/trainer'

/**
 * La persona que se enseña en el menú de usuario.
 *
 * Sale de la ficha de entrenador o de la de alumno, la que haya: un alumno no
 * tiene ficha de entrenador, y sin esto el menú pintaba sus iniciales a partir
 * de `undefined`.
 */
export interface ViewerPerson {
  firstName?: string
  lastName?: string
  photoUrl?: string
}

interface UseViewerResult {
  /** La ficha del entrenador, si esta cuenta entrena en algún sitio. */
  trainer: Trainer | null
  /** Quién es, para el menú de usuario: su ficha de entrenador o la de alumno. */
  person: ViewerPerson
  /**
   * Los crews a los que SE PERTENECE, con el papel en cada uno.
   *
   * Una solicitud pendiente no está aquí, y es una decisión de seguridad, no de
   * presentación: entrar en esta lista es lo que fija el ámbito de datos, así
   * que incluir a quien todavía espera aprobación le daría acceso al crew por
   * el mero hecho de haber escaneado el QR —justo lo que la aprobación existe
   * para impedir—.
   */
  memberships: Membership[]
  /** Las solicitudes enviadas y sin responder, sólo para poder decirlo. */
  pending: Membership[]
  /** En cuál se está trabajando ahora. `null` cuando no se pertenece a ninguno. */
  active: Membership | null
  /** Atajo de `active?.role`. `null` sin crew: no se es nada todavía. */
  role: CrewRole | null
  /**
   * Si se puede ESCRIBIR en el crew activo.
   *
   * Separado de `role` porque ver y poder son dos ejes: un administrador de
   * plataforma ve las pantallas de gestión de cualquier equipo —para eso entra—
   * y no toca nada. Todo control que crea, cambia o borra se apoya en esto; los
   * que sólo pintan, en `role`.
   */
  canManage: boolean
  /**
   * Si administra la plataforma.
   *
   * NO ES UN `CrewRole` MÁS, y por eso va aparte en vez de como tercer valor de
   * la unión. Un rol de crew responde «qué eres en este equipo»; esto responde
   * «estás por encima de los equipos», que es otra pregunta: un administrador
   * puede además entrenar en su propio crew, y las dos cosas son ciertas a la
   * vez. Meterlo en la misma unión obligaría a elegir.
   */
  isPlatformAdmin: boolean
  loading: boolean
  selectCrew: (crewId: string) => void
}

/**
 * Quién ha entrado, con qué papel, y en qué crew está trabajando.
 *
 * ES LA PIEZA QUE FALTABA. El registro ya distinguía entrenador de alumno, pero
 * después nadie usaba esa distinción: los dos aterrizaban en el panel del
 * entrenador y veían la misma navegación. Aquí se resuelve una sola vez, en el
 * layout, y de aquí sale qué se pinta.
 *
 * EL ROL SE DEDUCE DE QUIÉN TE CONOCE, nunca de un campo en la cuenta. Si
 * `crews.findByTrainerProfile` responde, entrenas ahí; si te encuentran las
 * fichas de alumno, entrenas allí como alumno. Un rol guardado en el usuario es
 * un rol que el usuario se puede cambiar con una llamada.
 *
 * Y FIJA EL ÁMBITO DE DATOS. Al resolver el crew activo llama a `setActiveCrew`,
 * que es lo que hace que `students.findAll()` devuelva los del crew correcto sin
 * que ningún hook ni ningún componente mencione la multi-tenencia.
 */
export function useViewer(): UseViewerResult {
  const user = useAuthStore((state) => state.user)
  const profileId = user?.id

  const [trainer, setTrainer] = useState<Trainer | null>(null)
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false)
  const [memberships, setMemberships] = useState<Membership[]>([])
  /*
   * Arranca con el crew recordado, no con `null`.
   *
   * `crewScope` ya lo ha leido del almacenamiento al cargar el modulo. Empezar
   * en `null` pondria el ambito a vacio durante el primer renderizado, y las
   * primeras consultas volverian sin nada antes de corregirse: un parpadeo de
   * «no tienes alumnos» en cada recarga. La validacion la hace `pickActiveCrew`
   * en cuanto llegan las pertenencias.
   */
  const [activeCrewId, setActiveCrewIdState] = useState<string | null>(() => crewScope.current())
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (): Promise<Membership[]> => {
    if (profileId === undefined) return []

    // Las dos preguntas van en paralelo: son independientes, y encadenarlas
    // pagaría dos viajes de red seguidos para pintar una barra lateral.
    const [ownedCrews, studentRecords, trainerProfile, platformAdmin] = await Promise.all([
      container.crews.findByTrainerProfile(profileId),
      container.students.findAllByProfileId(profileId),
      container.trainers.findByProfileId(profileId),
      container.platform.isAdmin(profileId),
    ])

    setTrainer(trainerProfile)
    setIsPlatformAdmin(platformAdmin)


    const asTrainer: Membership[] = ownedCrews.map((crew) => ({
      crew,
      role: 'trainer',
      status: 'active',
      student: null,
      observed: false,
    }))

    const asStudent = await Promise.all(
      studentRecords.map(async (student): Promise<Membership | null> => {
        const crew = await container.crews.findById(student.crewId)
        // Una ficha cuyo crew ya no existe no es una pertenencia: se ignora en
        // vez de pintar una entrada rota en el conmutador.
        if (crew === null) return null
        return {
          crew,
          role: 'student',
          status: student.membershipStatus,
          student,
          observed: false,
        }
      })
    )

    const own = [...asTrainer, ...asStudent.filter((entry) => entry !== null)]
    if (!platformAdmin) return own

    /*
     * UN ADMINISTRADOR ALCANZA TODOS LOS EQUIPOS, no sólo los suyos.
     *
     * Sin esto, «ver todos los módulos» daba pantallas vacías: los datos están
     * acotados al crew activo, y quien no pertenece a ninguno abre Estudiantes y
     * no hay nadie. Enseñar los módulos sin poder entrar en un equipo no es
     * verlos.
     *
     * Los propios van primero y no se duplican: si además entrena uno, ahí manda
     * de verdad, no como mirón.
     */
    const ownIds = new Set(own.map((entry) => entry.crew.id))
    const observed: Membership[] = (await container.platform.listCrews())
      .filter((entry) => !ownIds.has(entry.crew.id))
      .map((entry) => ({
        crew: entry.crew,
        role: 'trainer',
        status: 'active',
        student: null,
        observed: true,
      }))

    return [...own, ...observed]
  }, [profileId])

  /*
   * `rejected` no llega hasta aquí: el adaptador ya no lo devuelve. Lo que se
   * reparte son las pertenencias de verdad y las solicitudes en espera.
   */

  useEffect(() => {
    let active = true

    const resolve = async (): Promise<void> => {
      setLoading(true)
      const found = await load()
      if (!active) return

      setMemberships(found)
      setActiveCrewIdState((current) => pickActiveCrew(found.filter(belongs), current))
      setLoading(false)
    }

    void resolve()

    /*
     * Suscrito a LAS DOS COSAS, y las dos hacen falta:
     *
     * - a los crews, porque crear uno tiene que verse sin recargar, que es lo
     *   primero que hace un entrenador nuevo;
     * - a las fichas de alumno, porque unirse a un equipo crea una, y que el
     *   entrenador acepte cambia su estado. Sin esta, la barra lateral seguía
     *   diciendo «Sin equipo» después de solicitar la entrada, y al aceptar no
     *   pasaba nada hasta recargar;
     * - a las de entrenador, porque al registrarse la ficha nace DESPUÉS de que
     *   esto haya resuelto quién entra. Sin ella, el recién registrado se
     *   quedaba sin rol y aterrizaba en la pantalla del alumno.
     */
    const unsubscribes = [
      container.crews.onChange(() => void resolve()),
      container.students.onChange(() => void resolve()),
      container.trainers.onChange(() => void resolve()),
    ]

    return () => {
      active = false
      for (const unsubscribe of unsubscribes) unsubscribe()
    }
  }, [load])

  const belonging = memberships.filter(belongs)
  const active = belonging.find((entry) => entry.crew.id === activeCrewId) ?? null

  /*
   * El ámbito se fija en un efecto y no al calcular: escribir en un módulo
   * durante el renderizado es un efecto secundario, y con el modo estricto de
   * React el componente se renderiza dos veces a propósito para destaparlo.
   */
  useEffect(() => {
    // La ficha va con el crew: como entrenador es `null` -se ve todo el equipo-,
    // como alumno es la suya, y entonces solo se ven sus sesiones.
    setActiveCrew(activeCrewId, active?.student?.id ?? null)
  }, [activeCrewId, active])

  const selectCrew = useCallback((crewId: string) => {
    setActiveCrewIdState(crewId)
  }, [])

  return {
    trainer,
    person: trainer ?? active?.student ?? {},
    memberships: belonging,
    pending: memberships.filter((entry) => entry.status === 'pending'),
    active,
    role: active?.role ?? null,
    canManage: active !== null && active.role === 'trainer' && !active.observed,
    isPlatformAdmin,
    loading,
    selectCrew,
  }
}

/**
 * Cuál de los crews queda activo.
 *
 * Se respeta el que ya estuviera puesto **sólo si sigue siendo suyo**. El valor
 * viene de `localStorage`, así que es una pista de conveniencia y no una
 * autorización: si no está entre sus pertenencias se descarta sin más. Con un
 * backend real lo rechazaría RLS de todos modos, y aun así el cliente no debe
 * intentarlo.
 */
/** Si esta pertenencia da acceso al crew. Una solicitud en espera, no. */
function belongs(membership: Membership): boolean {
  return isMember(membership.status)
}

function pickActiveCrew(memberships: Membership[], current: string | null): string | null {
  if (current !== null && memberships.some((entry) => entry.crew.id === current)) {
    return current
  }
  return memberships[0]?.crew.id ?? null
}
