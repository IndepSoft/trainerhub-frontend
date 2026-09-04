import { Link } from 'react-router-dom'
import { Clock, QrCode } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { useViewerContext } from '@/app/ViewerContext'
import { useTranslation } from '@/shared/i18n/LanguageContext'

/**
 * La invitación a unirse a un equipo, sobre el progreso vacío.
 *
 * NO CORTA EL PASO, Y ES DELIBERADO. Debajo se pinta el registro entero —nivel,
 * racha, el sendero de hitos, los ocho logros— con todo a cero: enseñar lo que
 * va a tener explica el producto mucho mejor que una pantalla única que le
 * impida mirar. El vacío no es un hueco, es la demostración.
 *
 * Lo que no puede es leerse como un fallo, y por eso esto va ENCIMA y lo nombra:
 * un cero sin explicación se interpreta como que algo no ha cargado.
 */
export function JoinCrewPrompt() {
  const { t } = useTranslation()
  const { pending } = useViewerContext()

  /*
   * Con una solicitud en marcha se dice ESO, no «únete».
   *
   * Repetir la misma llamada a quien ya la ha atendido hace pensar que su
   * solicitud no se envió, y lo que hace entonces es volver a escanear. La
   * pantalla tiene que distinguir «no has hecho nada» de «estás esperando».
   */
  const waiting = pending[0]

  if (waiting !== undefined) {
    return (
      <section className="border-b border-cobalt-tint-3 bg-bone px-5 py-6">
        <div className="mx-auto flex max-w-xl flex-col items-start gap-3">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/45">
            <Clock aria-hidden="true" className="size-3.5" />
            {t('joinCrew.requestSent')}
          </p>
          <h2 className="font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
            {t('joinCrew.waitingFor', { crew: waiting.crew.name })}
          </h2>
          <p className="text-sm text-ink/60">
            {t('joinCrew.waitingHint')}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="border-b border-cobalt-tint-3 bg-cobalt-tint px-5 py-6">
      <div className="mx-auto flex max-w-xl flex-col items-start gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cobalt">
          {t('joinCrew.startHere')}
        </p>
        <h2 className="font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
          {t('joinCrew.title')}
        </h2>
        <p className="text-sm text-ink/60">
          {t('joinCrew.hint')}
        </p>

        <Button asChild className="mt-1 gap-2">
          <Link to="/crew/unirse">
            <QrCode className="size-4" />
            {t('joinCrew.haveCode')}
          </Link>
        </Button>
      </div>
    </section>
  )
}
