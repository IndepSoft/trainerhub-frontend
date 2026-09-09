import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/app/stores/authStore'
import type { ReactNode } from 'react'
import { LoadingFallback } from '@/shared/components/LoadingFallback'

interface GuestRouteProps {
  children: ReactNode
}

/**
 * Las pantallas que sólo tienen sentido sin sesión.
 *
 * ESTABA ESCRITO Y SIN CABLEAR, y pasó a hacer falta de verdad con la
 * confirmación por correo: el enlace del mensaje devuelve a `/authentication` ya
 * con la sesión abierta —`supabase-js` la recoge de la URL al cargar— y sin esta
 * guardia el recién confirmado se quedaba mirando el formulario de acceso,
 * dentro de la aplicación y sin saberlo.
 *
 * MANDA A LA RAÍZ, NO AL PANEL. Iba a `/dashboard`, que es la pantalla de
 * gestión del entrenador; ahí un alumno aterrizaba en la aplicación de otra
 * persona. En la raíz decide `HomeRedirect`, que es el único sitio donde esa
 * decisión está escrita una vez.
 *
 * No compite con el `navigate` del formulario de acceso: `useLogin` cambia la
 * ruta en la misma tanda en que fija el usuario, así que cuando React vuelve a
 * pintar esta guardia ya no está montada. Quien llega aquí con sesión es quien
 * viene de fuera —del enlace del correo, o de teclear la dirección—.
 */
export const GuestRoute = ({ children }: GuestRouteProps) => {
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)

  if (loading) {
    return <LoadingFallback />
  }

  return !user ? <>{children}</> : <Navigate to="/" replace />
}
