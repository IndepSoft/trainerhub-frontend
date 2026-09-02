import { CREW_ROLE_RANK } from '@/shared/domain/entities/crew'
import { can } from '@/shared/domain/permissions'
import type { Capability } from '@/shared/domain/permissions'
import type { CrewRole } from '@/shared/domain/entities/crew'
import {
  type LucideIcon,
  Home,
  Dumbbell,
  Settings,
  BarChart3,
  Calendar,
  Users,
  Award,
  ShieldCheck,
} from 'lucide-react'

export interface NavigationItem {
  id: string
  label: string
  href: string
  icon?: LucideIcon
  badge?: string | number
  disabled?: boolean
  requiresAuth?: boolean // para ProtectedRoute
  guestOnly?: boolean // para GuestRoute
  showInSidebar?: boolean
  showInMobile?: boolean
  /**
   * La capacidad que hace falta para ver este destino.
   *
   * SE PREGUNTA POR LA CAPACIDAD, NO POR EL ROL, y es lo que hace que conceder
   * un permiso suelto sirva de algo. Antes la navegación filtraba sólo por
   * rango, así que darle «Rutinas y planes» a un alumno veterano no le abría
   * nada: la concesión se guardaba y la puerta seguía cerrada.
   */
  capability?: Capability
  /**
   * El rango MÍNIMO que ve este destino, para lo que no es una sola capacidad.
   *
   * El panel y los informes son RESÚMENES de gestión: no autorizan una acción
   * concreta, resumen varias. Pedirles una capacidad obligaría a inventar una
   * —«ver el resumen»— que no autoriza nada y que habría que mantener.
   *
   * Ausente —y sin capacidad— significa «todos los que han entrado», que es lo
   * correcto para Calendario y Progreso: las dos cosas las mira quien gestiona y
   * las mira el alumno, aunque vean datos distintos.
   *
   * MÍNIMO Y NO UNA LISTA DE ROLES, y el cambio salió de un fallo real: decía
   * `roles: ['trainer']`, y al aparecer `admin` por encima resultó que el dueño
   * de un gimnasio no está en esa lista —así que se quedó sin Estudiantes, sin
   * Entrenamientos y sin Panel—. Con una lista, cada rol nuevo obliga a repasar
   * todas; con un mínimo, el rango se encarga.
   *
   * Esconder un destino no es la seguridad: la seguridad es la política del
   * servidor. Esto es no ofrecer puertas que no abren.
   */
  minRole?: CrewRole
  /**
   * Sólo para quien administra la plataforma.
   *
   * Va aparte de `roles` porque no es un rol de crew: no depende de en qué
   * equipo se esté, ni de estar en alguno. Un administrador sin equipo tiene que
   * ver su panel igual.
   */
  platformOnly?: boolean
  children?: NavigationItem[]
}

export const navigationConfig: NavigationItem[] = [
  {
    id: 'dashboard',
    minRole: 'trainer',
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    requiresAuth: true,
    showInSidebar: true,
    showInMobile: true,
  },
  {
    id: 'students',
    capability: 'students.manage',
    label: 'Estudiantes',
    href: '/students',
    icon: Users,
    requiresAuth: true,
    showInSidebar: true,
    showInMobile: true,
  },
  {
    id: 'trainings',
    capability: 'training.manage',
    label: 'Entrenamientos',
    href: '/trainings',
    icon: Dumbbell,
    requiresAuth: true,
    showInSidebar: true,
    showInMobile: true,
  },
  {
    id: 'calendar',
    label: 'Calendario',
    href: '/calendar',
    icon: Calendar,
    requiresAuth: true,
    showInSidebar: true,
    showInMobile: true,
  },
  {
    id: 'progress',
    label: 'Progreso',
    href: '/progress',
    icon: Award,
    requiresAuth: true,
    showInSidebar: true,
    showInMobile: true,
  },
  {
    id: 'reports',
    minRole: 'trainer',
    label: 'Reportes',
    href: '/reports',
    icon: BarChart3,
    requiresAuth: true,
    showInSidebar: true,
    showInMobile: false,
  },
  {
    id: 'settings',
    label: 'Configuración',
    href: '/settings',
    icon: Settings,
    requiresAuth: true,
    showInSidebar: true,
    // Fuera de la barra inferior: cinco destinos es el maximo antes de que la
    // etiqueta deje de caber a 375 px, y este es el menos frecuente. Ademas
    // `/settings` sigue sin ruta registrada (deuda conocida).
    showInMobile: false,
  },

  {
    id: 'admin',
    label: 'Plataforma',
    href: '/admin',
    icon: ShieldCheck,
    requiresAuth: true,
    platformOnly: true,
    showInSidebar: true,
    // Fuera de la barra inferior: no es una pantalla de uso diario, y cinco
    // destinos es el maximo antes de que la etiqueta deje de caber a 375 px.
    showInMobile: false,
  },

  // Rutas de guest (sin auth)
  {
    id: 'authentication',
    label: 'Autenticación',
    href: '/authentication',
    guestOnly: true, // ← Solo para GuestRoute
    showInSidebar: false,
    showInMobile: false,
  },
  {
    id: 'login',
    label: 'Login',
    href: '/login',
    guestOnly: true, // ← Solo para GuestRoute
    showInSidebar: false,
    showInMobile: false,
  },
]

/**
 * Si un destino le corresponde a este papel.
 *
 * Sin crew -`role` a `null`- se ofrece SOLO lo que no pide rol: un alumno recien
 * registrado navega Calendario y Progreso, los ve vacios, y todo le empuja a
 * unirse a un equipo. Es deliberado: enseñarle lo que va a tener explica el
 * producto mucho mejor que una pantalla unica que le corta el paso.
 */
function matchesViewer(item: NavigationItem, viewer: NavigationViewer): boolean {
  // El panel de plataforma sólo lo ve quien la administra, y lo ve siempre:
  // no depende de en qué equipo esté, ni de estar en alguno.
  if (item.platformOnly === true) return viewer.isPlatformAdmin

  // La capacidad manda sobre el rango: incluye lo que el rol trae de serie Y lo
  // que se haya concedido aparte, que es lo que hace útil una concesión suelta.
  if (item.capability !== undefined) {
    if (viewer.role === null) return false
    return can(viewer.role, item.capability, viewer.extraCapabilities)
  }

  if (item.minRole === undefined) return true
  if (viewer.role === null) return false

  // Por RANGO: quien manda más ve todo lo de quien manda menos. Comparar por
  // igualdad dejaba fuera al administrador de los destinos de gestión.
  return CREW_ROLE_RANK[viewer.role] <= CREW_ROLE_RANK[item.minRole]
}

/** Quien navega, en lo que hace falta para decidir qué se le ofrece. */
export interface NavigationViewer {
  role: CrewRole | null
  /** Lo concedido por encima del rol. Ver `permissions.ts`. */
  extraCapabilities: Capability[]
  isPlatformAdmin: boolean
}

// Helpers para filtrar rutas
export const getSidebarRoutes = (viewer: NavigationViewer) =>
  navigationConfig.filter(
    (item) => item.showInSidebar && item.requiresAuth && matchesViewer(item, viewer)
  )

/** Destinos de la barra inferior en movil. Maximo cinco. */
export const getMobileRoutes = (viewer: NavigationViewer) =>
  navigationConfig.filter(
    (item) => item.showInMobile && item.requiresAuth && matchesViewer(item, viewer)
  )

export const getGuestRoutes = () =>
  navigationConfig.filter((item) => item.guestOnly)

export const getProtectedRoutes = () =>
  navigationConfig.filter((item) => item.requiresAuth)
