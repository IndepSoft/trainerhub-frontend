import { useNavigate, useSearchParams } from 'react-router-dom'
import { AchievementCelebration } from '../components/AchievementCelebration'
import { useLatestAchievement } from '../hooks/useLatestAchievement'
import { useViewerContext } from '@/app/ViewerContext'
import { useTranslation } from '@/shared/i18n/LanguageContext'

/**
 * Pantalla de celebración. Sólo composición.
 *
 * Tiene ruta propia y no es sólo una superposición porque una notificación push
 * motivacional debe poder abrirla directamente: sin URL no hay destino al que
 * llevar al usuario desde la notificación.
 *
 * AL SALIR NO SIEMPRE SE VA A PROGRESO, y ése fue un fallo real: cerrar una
 * sesión llevaba a un entrenador a una pantalla que su propio menú ya no le
 * ofrece, desde que el progreso del alumno se mudó a su tarjeta y su ficha. El
 * logro es del alumno; a dónde se vuelve depende de quién estaba mirando.
 *
 * El texto sí se le enseña a los dos, y es correcto: está escrito en tercera
 * persona —«Logro desbloqueado», el nombre, los XP— así que un entrenador ve que
 * su alumna acaba de conseguir algo, que es buena noticia para él también.
 */
export default function Celebration() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { hasOwnProgress, loading: loadingViewer } = useViewerContext()

  // Qué sesión se acaba de cerrar. Sin ella no se sabe a quién felicitar: la
  // pantalla celebraba una racha que no era de nadie.
  const [searchParams] = useSearchParams()
  const { achievement, headlineValue, headlineLabel, loading } = useLatestAchievement(
    searchParams.get('session') ?? undefined
  )

  /*
   * Quien entrena vuelve a SU progreso; quien gestiona, a la agenda, que es de
   * donde salió la sesión y donde está la siguiente. Es el bucle que cierra el
   * trabajo del entrenador.
   */
  const exit = hasOwnProgress ? '/progress' : '/calendar'

  // Mientras carga no se decide nada: `achievement === null` todavía no
  // significa «no hay logro», y salir aquí devolvería siempre. Se espera también
  // a saber quién mira, o el destino se elegiría antes de saberlo.
  if (loading || loadingViewer) return null

  // Sin logro desbloqueado no hay nada que celebrar: se sale en vez de pintar
  // una pantalla de celebración vacía.
  if (!achievement) {
    navigate(exit, { replace: true })
    return null
  }

  return (
    <AchievementCelebration
      achievement={achievement}
      headlineValue={headlineValue}
      headlineLabel={headlineLabel}
      onDismiss={() => navigate(exit)}
      dismissLabel={t('achievement.keepGoing')}
    />
  )
}
