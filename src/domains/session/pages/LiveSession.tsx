import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { container } from '@/app/container'
import { CardioSession } from '../components/CardioSession'
import { StrengthSession } from '../components/StrengthSession'
import { useSessionToRun } from '../hooks/useSessionToRun'

/**
 * La sesión en vivo. Sólo composición: decide con qué pantalla se ejecuta.
 *
 * ANTES ERA UNA SOLA, Y DE CARDIO. `/session` no recibía nada y siempre pintaba
 * la misma sesión simulada corriendo por un mapa, así que agendar «Full body»
 * para María y pulsar iniciar te dejaba en la sesión de otra persona. Todo lo
 * que compone este proyecto es entrenamiento de sala y no tenía dónde
 * ejecutarse.
 *
 * Ahora recibe su identificador y conmuta por la modalidad de la sesión. No se
 * deriva de si tiene rutina: una evaluación inicial no tiene y tampoco es
 * cardio, y acabaría enseñando un mapa.
 *
 * TERMINAR CIERRA EL BUCLE. La sesión pasa a `completed` por el puerto, así que
 * lo que ocurre aquí vuelve a la agenda y a la ficha del alumno.
 */
export default function LiveSession() {
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()
  const { session, routine, studentName, loading } = useSessionToRun(sessionId)

  // Mientras carga no se pinta nada: `session === null` no significa «no existe»
  // hasta que `loading` es falso.
  if (loading) return null

  if (session === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-bone px-6 text-center">
        <p className="font-display text-2xl font-extrabold uppercase text-ink">
          Sesión no encontrada
        </p>
        <p className="text-sm text-ink/50">
          El enlace puede haber caducado o la sesión ya no existe.
        </p>
        <Button asChild variant="outline">
          <Link to="/calendar">Volver a la agenda</Link>
        </Button>
      </div>
    )
  }

  const handleFinish = () => {
    void container.sessions.updateStatus(session.id, 'completed')
    navigate('/progress/celebracion')
  }

  if (session.modality === 'cardio') {
    return (
      <CardioSession session={session} studentName={studentName} onFinish={handleFinish} />
    )
  }

  return (
    <StrengthSession
      session={session}
      routine={routine}
      studentName={studentName}
      onFinish={handleFinish}
    />
  )
}
