import { useCallback, useEffect, useState } from 'react'
import { container } from '@/app/container'
import { crewScope, setActiveCrew } from '@/app/crewScope'
import { useAuthStore } from '@/app/stores/authStore'
import { isMember } from '@/shared/domain/entities/crew'
import { can } from '@/shared/domain/permissions'
import type { Capability } from '@/shared/domain/permissions'
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
   * Si el papel con el que se está en el crew activo autoriza algo.
   *
   * Sustituye a un `canManage` de sí o no. Con tres roles y un caso de gimnasio,
   * «puede gestionar» dejó de ser una pregunta con respuesta única: un
   * entrenador lleva alumnos y agenda pero no toca los ajustes ni decide quién
   * trabaja allí, y eso no se expresa con un booleano.
   *
   * Devuelve `false` sin crew activo, que es lo correcto: no se puede nada donde
   * no se está.
   */
  can: (capability: Capability) => boolean
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
 * tienes un puesto en un crew, gestionas ahí con el rango que diga el puesto; si
 * te encuentran las fichas de alumno, entrenas allí como alumno. Un rol guardado en el usuario es
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

  const load = useCallback(async (): Promise<Membership[] | null> => {
    /*
     * `null` es «todavía no se sabe», y es distinto de «no pertenece a nada».
     *
     * Devolvía `[]`, y con eso el ciclo terminaba dando `loading: false` antes de
     * que la sesión estuviera resuelta: durante ese instante quien acababa de
     * identificarse no era administrador de nada, y `HomeRedirect` —que espera a
     * `loading`— le mandaba a la pantalla equivocada y ya no volvía.
     */
    if (profileId === undefined) return null

    // Las preguntas van en paralelo: son independientes, y encadenarlas pagaría
    // tres viajes de red seguidos para pintar una barra lateral.
    const [staffPosts, studentRecords, trainerProfile, platformAdmin] = await Promise.all([
      container.crewStaff.findAllByProfileId(profileId),
      container.students.findAllByProfileId(profileId),
      container.trainers.findByProfileId(profileId),
      container.platform.isAdmin(profileId),
    ])

    setTrainer(trainerProfile)
    setIsPlatformAdmin(platformAdmin)

    /*
     * EL ROL SALE DEL PUESTO, no de haber fundado el crew.
     *
     * Antes se derivaba de `ownerId`, y con eso sólo cabía una persona
     * gestionando: el fundador. El caso del gimnasio —un dueño que gobierna y
     * varios entrenadores que entrenan— no se podía expresar. Ahora cada puesto
     * dice con qué rango se está, y quien crea un crew se da de alta como
     * `admin` en el mismo acto.
     */
    const asStaff = await Promise.all(
      staffPosts.map(async (post): Promise<Membership | null> => {
        const crew = await container.crews.findById(post.crewId)
        if (crew === null) return null
        return {
          crew,
          role: post.role,
          status: 'active',
          student: null,
          extraCapabilities: post.extraCapabilities,
        }
      })
    )

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
          extraCapabilities: student.extraCapabilities,
        }
      })
    )

    /*
     * SÓLO LOS EQUIPOS PROPIOS, también para el administrador de plataforma.
     *
     * Durante un rato alcanzó todos los crews para poder «ver todos los
     * módulos». Se ha quitado: administrar la plataforma es gestionar cuentas y
     * accesos, no leer los datos de los alumnos de un cliente —su edad, su grasa
     * corporal, sus objetivos— sin que nadie se entere. Para ver la aplicación
     * funcionando tiene su propio equipo.
     */
    return [...asStaff, ...asStudent].filter((entry) => entry !== null)
  }, [profileId])

  /*
   * `rejected` no llega hasta aquí: el adaptador ya no lo devuelve. Lo que se
   * reparte son las pertenencias de verdad y las solicitudes en espera.
   */

  useEffect(() => {
    let active = true

    /*
     * `setLoading(true)` va AQUI y no dentro de `resolve`, que es lo que se
     * ejecuta tambien en cada aviso de las suscripciones.
     *
     * Estaba dentro, y con eso cualquier cambio en cualquier equipo devolvia la
     * aplicacion entera al estado de carga durante un instante: las pantallas
     * que hacen `if (loading) return null` se DESMONTABAN y volvian a montarse,
     * perdiendo por el camino la pestaña abierta, el desplazamiento y cualquier
     * estado local. Se veia como un parpadeo, y en el panel de plataforma como
     * un salto de «Cuentas» de vuelta a «Equipos» al guardar un permiso.
     *
     * Aqui se ejecuta una vez por sesion resuelta, que es cuando de verdad no se
     * sabe nada todavia. Un refresco tiene los datos anteriores y no necesita
     * fingir que no los tiene.
     */
    setLoading(true)

    const resolve = async (): Promise<void> => {
      const found = await load()
      if (!active) return

      // Sin sesión resuelta se sigue esperando: ver la nota de `load`.
      if (found === null) return

      setMemberships(found)

      /*
       * El ámbito se fija AQUÍ, además de en el efecto de abajo.
       *
       * Con sólo el efecto iba un tick por detrás: `HomeRedirect` navegaba en
       * cuanto `loading` era falso, y el crew activo se guardaba después. Una
       * recarga inmediata sobre una ruta profunda —abrir una sesión recién
       * identificado— leía el almacenamiento antes de que se hubiera escrito, se
       * quedaba sin ámbito y la sesión salía como «no encontrada».
       *
       * Aquí no es un efecto secundario del renderizado: `resolve` corre fuera
       * de él. Escribir dos veces el mismo valor es inofensivo.
       */
      const belongingFound = found.filter(belongs)
      const picked = pickActiveCrew(belongingFound, crewScope.current())
      const pickedMembership = belongingFound.find((entry) => entry.crew.id === picked) ?? null
      setActiveCrew(picked, pickedMembership?.student?.id ?? null)

      setActiveCrewIdState(picked)
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
      /*
       * TAMBIEN A LOS PUESTOS, desde que el rol sale de ahi y no de haber
       * fundado el equipo. Sin esta suscripcion, crear un crew se rompia:
       * `crews.create` avisaba, esto recargaba, y en ese instante el puesto de
       * administrador todavia no existia -se escribe justo despues-, asi que la
       * pertenencia no aparecia nunca y el fundador se quedaba fuera de su
       * propio equipo.
       */
      container.crewStaff.onChange(() => void resolve()),
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
   * Y se vuelve a fijar cuando cambia de otro modo: al cambiar de equipo con el
   * conmutador, o cuando la pertenencia cambia sola —aceptan tu solicitud—.
   *
   * En un efecto y no al calcular: escribir en un módulo durante el renderizado
   * es un efecto secundario, y con el modo estricto de React el componente se
   * renderiza dos veces a propósito para destaparlo.
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
    can: (capability: Capability) =>
      active !== null && can(active.role, capability, active.extraCapabilities),
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
