import { GamificationHeader } from '@/domains/progress/components/GamificationHeader'
import { MilestonePath } from '@/domains/progress/components/MilestonePath'
import { useGamificationProfile } from '@/domains/progress/hooks/useGamificationProfile'

interface StudentProgressSectionProps {
  studentId: string
  /** Cómo se le llama, para que la sección hable de alguien. */
  firstName: string
}

/**
 * El progreso de un alumno, dentro de su ficha.
 *
 * AQUÍ Y NO EN UNA PANTALLA APARTE. Vivía en `/progress` con un selector para
 * elegir a quién mirar, y eso obligaba a salir de la ficha, ir a otro sitio y
 * buscar de nuevo a la misma persona que ya se tenía delante. El progreso de un
 * alumno es un dato suyo, no un módulo.
 *
 * Reutiliza los componentes del dominio `progress` —son presentación pura— en
 * vez de copiarlos: la barra de nivel y el sendero de hitos tienen que decir lo
 * mismo aquí que en la pantalla del alumno, o serían dos verdades del mismo
 * esfuerzo.
 *
 * NO trae los logros ni la racha en grande: eso es el registro de celebración,
 * pensado para quien entrena y mira su propio progreso. Al entrenador le sirve
 * la medida.
 */
export function StudentProgressSection({ studentId, firstName }: StudentProgressSectionProps) {
  const { profile, completedCount, levelCompletion, experienceToNextLevel, loading } =
    useGamificationProfile(studentId)

  if (loading) return null

  return (
    <section className="px-5 py-8" aria-labelledby="progreso-titulo">
      <h2
        id="progreso-titulo"
        className="mb-4 border-b border-cobalt-tint-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60"
      >
        Progreso
      </h2>

      {completedCount === 0 ? (
        <p className="text-sm text-ink/45">
          {/* Se nombra a la persona: en una ficha, «todavía no ha entrenado» sin
              sujeto se lee como un fallo de la pantalla. */}
          {firstName} todavía no ha completado ninguna sesión. El progreso se
          calcula a partir de ellas.
        </p>
      ) : (
        <>
          <GamificationHeader
            streak={profile.streak}
            level={profile.level}
            levelCompletion={levelCompletion}
            experienceToNextLevel={experienceToNextLevel}
          />

          <MilestonePath milestones={profile.milestones} />
        </>
      )}
    </section>
  )
}
