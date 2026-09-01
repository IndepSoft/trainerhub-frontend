import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, RefreshCw } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { buildJoinUrl, formatJoinCode } from '../libs/joinLink'
import type { Crew } from '@/shared/domain/entities/crew'

interface CrewInviteCardProps {
  crew: Crew
  onRotate: () => Promise<void>
  rotating: boolean
}

/**
 * El QR que el entrenador enseña para que alguien entre al crew.
 *
 * SE VE GRANDE Y A OSCURAS NO. Esto se enseña desde el móvil del entrenador a
 * medio metro, en un gimnasio, y a veces con el brillo bajo: un QR pequeño o con
 * poco contraste es un QR que no se lee y una persona esperando. Ocupa el ancho
 * que tenga, hasta un tope, y va sobre blanco puro aunque la aplicación sea
 * hueso —el contraste del código no es decoración—.
 *
 * DEBAJO, SIEMPRE EL CÓDIGO ESCRITO. Es la salida cuando la cámara no colabora:
 * permiso denegado, lente sucia, teléfono viejo. Cuesta una línea y evita que el
 * alta dependa de que un hardware ajeno funcione.
 */
export function CrewInviteCard({ crew, onRotate, rotating }: CrewInviteCardProps) {
  const [copied, setCopied] = useState(false)
  const joinUrl = buildJoinUrl(crew.joinToken)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Sin permiso de portapapeles no se puede copiar, y no pasa nada: el
      // enlace está a la vista y el código también.
    }
  }

  return (
    <section className="space-y-4" aria-labelledby="invitacion-titulo">
      <h2
        id="invitacion-titulo"
        className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60"
      >
        Invitar al equipo
      </h2>

      <div className="mx-auto w-full max-w-[18rem] rounded-block border border-cobalt-tint-3 bg-white p-5">
        <QRCodeSVG
          value={joinUrl}
          // `100%` y `viewBox`: el SVG se adapta al ancho disponible en vez de
          // quedarse en un tamaño fijo que en un móvil pequeño no cabe y en una
          // pantalla grande se queda diminuto.
          className="h-auto w-full"
          size={256}
          level="M"
          marginSize={2}
        />
      </div>

      <div className="text-center">
        <p className="text-xs text-ink/50">O que escriba este código:</p>
        <p className="metric-figures mt-1 font-display text-3xl font-extrabold tracking-[0.1em] text-ink">
          {formatJoinCode(crew.joinToken)}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button variant="outline" className="gap-2" onClick={() => void handleCopy()}>
          <Copy className="size-4" />
          {copied ? 'Enlace copiado' : 'Copiar enlace'}
        </Button>

        <Button
          variant="outline"
          className="gap-2"
          disabled={rotating}
          onClick={() => void onRotate()}
        >
          <RefreshCw className="size-4" />
          {rotating ? 'Generando…' : 'Generar uno nuevo'}
        </Button>
      </div>

      <p className="text-center text-xs text-ink/45">
        {/* El porqué del botón de rotar, dicho donde se decide usarlo. */}
        Genera uno nuevo si el anterior se ha compartido de más: el viejo deja de
        funcionar al instante.
      </p>
    </section>
  )
}
