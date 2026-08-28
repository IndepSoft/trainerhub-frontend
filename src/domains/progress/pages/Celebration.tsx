import { useNavigate } from 'react-router-dom'
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
  const { achievement, headlineValue, headlineLabel } = useLatestAchievement()

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
