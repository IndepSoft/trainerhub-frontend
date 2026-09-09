import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { container } from '@/app/container'
import { describeError } from '@/shared/i18n/errorMessages'
import { readIntendedPath } from '@/auth/libs/intendedPath'
import { CardioSession } from '../components/CardioSession'
import { StrengthSession } from '../components/StrengthSession'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { useSessionToRun } from '../hooks/useSessionToRun'
import type { SessionResult } from '@/shared/domain/entities/session'

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
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()
  const location = useLocation()
  /*
   * De donde se vino: la ficha del alumno, la agenda, el panel. Viaja en el
   * estado de la navegacion -como el destino pretendido del acceso- y se
   * devuelve a la celebracion, que vuelve alli. Sin origen se vuelve a la agenda.
   */
  const origin = readIntendedPath(location.state)
  const [finishError, setFinishError] = useState<string | null>(null)
  const { session, routine, studentName, loading } = useSessionToRun(sessionId)

  // Mientras carga no se pinta nada: `session === null` no significa «no existe»
  // hasta que `loading` es falso.
  if (loading) return null

  if (session === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-bone px-6 text-center">
        <p className="font-display text-2xl font-extrabold uppercase text-ink">
          {t('liveSession.notFound')}
        </p>
        <p className="text-sm text-ink/50">{t('liveSession.notFoundHint')}</p>
        <Button asChild variant="outline">
          <Link to="/calendar">{t('liveSession.backToCalendar')}</Link>
        </Button>
      </div>
    )
  }

  /*
   * Una sesion completada o cancelada NO SE EJECUTA. Completada, volver a
   * cerrarla sobrescribia el resultado -y con el la progresion de cargas-;
   * cancelada, ya se decidio que no. La ficha de la agenda apaga «Iniciar» en
   * los dos casos; aqui se cubre el enlace directo.
   */
  if (session.status === 'completed' || session.status === 'cancelled') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-bone px-6 text-center">
        <p className="font-display text-2xl font-extrabold uppercase text-ink">
          {session.status === 'completed'
            ? t('liveSession.alreadyDone')
            : t('liveSession.cancelled')}
        </p>
        <p className="text-sm text-ink/50">{t('liveSession.closedHint')}</p>
        <Button asChild variant="outline">
          <Link to={origin ?? '/calendar'}>{t('liveSession.back')}</Link>
        </Button>
      </div>
    )
  }

  /*
   * Cerrar ANOTA lo que ocurrio, no solo que ocurrio.
   *
   * Antes se llamaba a `updateStatus(id, 'completed')` y las series marcadas y
   * el tiempo se perdian con el componente. Progreso no tenia de donde sacar un
   * numero y se los inventaba; ahora sale de aqui.
   *
   * El resultado lo pasa la pantalla que ejecuta, que es la unica que lo sabe:
   * la de fuerza cuenta series, la de cardio cuenta tiempo.
   */
  const handleFinish = async (result: SessionResult) => {
    /*
     * SE ESPERA antes de ir a la celebracion. Sin esperar, la celebracion
     * releia la sesion y el historial antes de que la escritura llegara, no
     * encontraba logro nuevo y redirigia en el acto: con red de verdad se
     * perdia la unica recompensa que da la aplicacion. Si el cierre falla, se
     * queda aqui y lo dice, en vez de celebrar algo que no ocurrio.
     */
    try {
      await container.sessions.complete(session.id, result)
    } catch (caught) {
      setFinishError(describeError(caught, t, 'liveSession.finishError'))
      return
    }
    // El origen viaja a la celebracion, que devuelve alli: la ficha del
    // alumno si se vino de ella, la agenda si se vino de la agenda.
    const query = new URLSearchParams({ session: session.id })
    if (origin !== null) query.set('from', origin)
    navigate(`/progress/celebracion?${query.toString()}`)
  }

  const screen =
    session.modality === 'cardio' ? (
      <CardioSession
        session={session}
        studentName={studentName}
        onFinish={handleFinish}
        exitTo={origin ?? '/calendar'}
      />
    ) : (
      <StrengthSession
        session={session}
        routine={routine}
        studentName={studentName}
        onFinish={handleFinish}
        exitTo={origin ?? '/calendar'}
      />
    )

  return (
    <>
      {finishError !== null && (
        <Alert variant="destructive" className="m-4">
          <AlertDescription>{finishError}</AlertDescription>
        </Alert>
      )}
      {screen}
    </>
  )
}
