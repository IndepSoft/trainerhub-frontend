import { Navigate } from 'react-router-dom'
import { useViewerContext } from '@/app/ViewerContext'
import { LoadingFallback } from '@/shared/components/LoadingFallback'

/**
 * A dónde lleva la raíz, según quién entra.
 *
 * ERA UN `Navigate` FIJO A `/dashboard`, que es la pantalla del entrenador:
 * indicadores del negocio, próximas sesiones de todos sus alumnos, rutinas
 * creadas. Un alumno aterrizaba ahí y veía la aplicación de otra persona.
 *
 * Los tres destinos responden a los tres estados en los que se puede llegar:
 *
 * - **Con equipo, entrenando**: al panel, que es su puesto de trabajo.
 * - **Con equipo, como alumno**: a Progreso —su nivel, su racha, su camino—.
 *   Vacío al principio, y ese vacío es deliberado: enseña lo que va a tener y
 *   empuja a entrenar, en vez de cortarle el paso.
 * - **Sin equipo**: depende de si ya tiene ficha de entrenador. Quien acaba de
 *   registrarse como entrenador va a CREAR SU EQUIPO, porque sin uno no hay
 *   dónde meter alumnos ni rutinas y la aplicación no tiene nada que enseñarle.
 *   Quien no la tiene va a Progreso, donde le espera la invitación a unirse.
 *
 * Se espera a saber quién es antes de redirigir. Sin esperar, todo el mundo
 * pasaría un instante por la ruta equivocada y volvería, que es un parpadeo y
 * una entrada de más en el historial.
 */
export default function HomeRedirect() {
  const { role, trainer, loading } = useViewerContext()

  if (loading) return <LoadingFallback />

  if (role === 'trainer') return <Navigate to="/dashboard" replace />
  if (role === null && trainer !== null) return <Navigate to="/crew/nuevo" replace />

  return <Navigate to="/progress" replace />
}
