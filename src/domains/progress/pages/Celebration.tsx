import { useNavigate, useSearchParams } from 'react-router-dom'
import { AchievementCelebration } from '../components/AchievementCelebration'
import { useLatestAchievement } from '../hooks/useLatestAchievement'

/**
 * Pantalla de celebración. Sólo composición.
 *
 * Tiene ruta propia y no es sólo una superposición porque una notificación push
 * motivacional debe poder abrirla directamente: sin URL no hay destino al que
 * llevar al usuario desde la notificación.
 */
export default function Celebration() {
  const navigate = useNavigate()
  // Qué sesión se acaba de cerrar. Sin ella no se sabe a quién felicitar: la
  // pantalla celebraba una racha que no era de nadie.
  const [searchParams] = useSearchParams()
  const { achievement, headlineValue, headlineLabel, loading } = useLatestAchievement(
    searchParams.get('session') ?? undefined
  )

  // Mientras carga no se decide nada: `achievement === null` todavía no
  // significa «no hay logro», y salir aquí devolvería a progreso siempre.
  if (loading) return null

  // Sin logro desbloqueado no hay nada que celebrar: se vuelve a progreso en vez
  // de pintar una pantalla de celebración vacía.
  if (!achievement) {
    navigate('/progress', { replace: true })
    return null
  }

  return (
    <AchievementCelebration
      achievement={achievement}
      headlineValue={headlineValue}
      headlineLabel={headlineLabel}
      onDismiss={() => navigate('/progress')}
    />
  )
}
