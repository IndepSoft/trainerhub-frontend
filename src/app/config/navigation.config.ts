import {
  type LucideIcon,
  Home,
  Dumbbell,
  Settings,
  BarChart3,
  Calendar,
  Users,
  Award,
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
  children?: NavigationItem[]
}

export const navigationConfig: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    requiresAuth: true,
    showInSidebar: true,
    showInMobile: true,
  },
  {
    id: 'students',
    label: 'Estudiantes',
    href: '/students',
    icon: Users,
    requiresAuth: true,
    showInSidebar: true,
    showInMobile: true,
  },
  {
    id: 'trainings',
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

// Helpers para filtrar rutas
export const getSidebarRoutes = () =>
  navigationConfig.filter((item) => item.showInSidebar && item.requiresAuth)

/** Destinos de la barra inferior en movil. Maximo cinco. */
export const getMobileRoutes = () =>
  navigationConfig.filter((item) => item.showInMobile && item.requiresAuth)

export const getGuestRoutes = () =>
  navigationConfig.filter((item) => item.guestOnly)

export const getProtectedRoutes = () =>
  navigationConfig.filter((item) => item.requiresAuth)
