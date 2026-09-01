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
   * Quién ve este destino.
   *
   * Ausente significa «todos los que han entrado», que es lo correcto para
   * Calendario y Progreso: las dos cosas las mira el entrenador y las mira el
   * alumno, aunque vean datos distintos.
   *
   * Los que llevan `['trainer']` son de gestión —el padrón de alumnos, el
   * catálogo de entrenamientos, los informes— y un alumno no tiene nada que
   * hacer ahí. Esconderlos no es la seguridad: la seguridad es RLS en el
   * servidor. Esto es no ofrecer puertas que no abren.
   */
  roles?: CrewRole[]
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
    roles: ['trainer'],
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    requiresAuth: true,
    showInSidebar: true,
    showInMobile: true,
  },
  {
    id: 'students',
    roles: ['trainer'],
    label: 'Estudiantes',
    href: '/students',
    icon: Users,
    requiresAuth: true,
    showInSidebar: true,
    showInMobile: true,
  },
  {
    id: 'trainings',
    roles: ['trainer'],
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
    roles: ['trainer'],
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
  if (item.platformOnly === true) return viewer.isPlatformAdmin

  /*
   * Un administrador de plataforma llega a TODOS los módulos.
   *
   * No es un permiso de escritura: entra a ver cómo está la aplicación de sus
   * clientes, y lo que puede tocar lo decide `canManage`, no esto. Esconderle
   * pantallas le obligaría a pedir capturas para diagnosticar cualquier cosa.
   */
  if (viewer.isPlatformAdmin) return true

  if (item.roles === undefined) return true
  if (viewer.role === null) return false
  return item.roles.includes(viewer.role)
}

/** Quien navega, en lo que hace falta para decidir qué se le ofrece. */
export interface NavigationViewer {
  role: CrewRole | null
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
