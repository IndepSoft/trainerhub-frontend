import { Link } from 'react-router-dom'
import { Clock, QrCode } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { useViewerContext } from '@/app/ViewerContext'

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
            Solicitud enviada
          </p>
          <h2 className="font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
            Esperando a {waiting.crew.name}
          </h2>
          <p className="text-sm text-ink/60">
            Tu entrenador tiene que aceptarte. En cuanto lo haga, esto se llena
            con tus sesiones.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="border-b border-cobalt-tint-3 bg-cobalt-tint/40 px-5 py-6">
      <div className="mx-auto flex max-w-xl flex-col items-start gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cobalt">
          Empieza aquí
        </p>
        <h2 className="font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
          Únete a un equipo
        </h2>
        <p className="text-sm text-ink/60">
          Tu progreso se llena con las sesiones que entrenas. Escanea el QR de tu
          entrenador, o escribe su código.
        </p>

        <Button asChild className="mt-1 gap-2">
          <Link to="/crew/unirse">
            <QrCode className="size-4" />
            Tengo un código
          </Link>
        </Button>
      </div>
    </section>
  )
}
