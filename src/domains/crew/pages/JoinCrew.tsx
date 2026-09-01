import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Users } from 'lucide-react'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { PageHeader } from '@/shared/components/PageHeader'
import { useViewerContext } from '@/app/ViewerContext'
import { useJoinCrew, type JoinOutcome } from '../hooks/useJoinCrew'
import { JOIN_CODE_PARAM } from '../libs/joinLink'

/**
 * Unirse a un equipo con el código del QR.
 *
 * ES LA PANTALLA A LA QUE LLEVA EL QR. Como el código codifica una URL con
 * `?codigo=…`, la cámara nativa del móvil abre esto directamente y el campo
 * llega relleno: el alumno sólo confirma. Sin esa URL habría que escribir un
 * lector de QR dentro de la aplicación, pedir permiso de cámara y mantener un
 * decodificador, para acabar en el mismo sitio.
 *
 * Y el campo se puede escribir a mano, que es la salida cuando la cámara no
 * colabora. Un flujo sólo-QR se rompe con el permiso denegado, con mala luz y
 * con la pantalla rota.
 */
export default function JoinCrew() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { selectCrew } = useViewerContext()
  const { join, joining, error, clearError } = useJoinCrew()

  const [code, setCode] = useState(searchParams.get(JOIN_CODE_PARAM) ?? '')
  const [outcome, setOutcome] = useState<JoinOutcome | null>(null)

  /*
   * Con el código en la URL se envía solo.
   *
   * Quien viene del QR ya ha hecho su gesto —apuntar la cámara—; pedirle además
   * que pulse un botón sobre un campo que él no ha escrito es un paso que no
   * decide nada. Si falla, el formulario queda ahí para corregirlo a mano.
   */
  useEffect(() => {
    const fromUrl = searchParams.get(JOIN_CODE_PARAM)
    if (fromUrl === null) return

    void join(fromUrl).then((result) => {
      if (result !== null) setOutcome(result)
    })
  }, [searchParams, join])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = await join(code)
    if (result !== null) setOutcome(result)
  }

  if (outcome !== null) {
    return (
      <JoinResult
        outcome={outcome}
        onEnter={() => {
          selectCrew(outcome.crew.id)
          navigate('/progress')
        }}
      />
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      <PageHeader className="pb-4">
        <PageHeader.Eyebrow>Tu equipo</PageHeader.Eyebrow>
        <PageHeader.Title>Unirse</PageHeader.Title>
      </PageHeader>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-md space-y-6 px-5 py-6">
          <p className="text-sm text-ink/60">
            Pídele a tu entrenador el código de su equipo, o apunta la cámara a su
            QR: se abrirá esta misma pantalla con el código ya puesto.
          </p>

          {error !== null && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label
                htmlFor="codigo-equipo"
                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60"
              >
                Código del equipo
              </Label>
              <Input
                id="codigo-equipo"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value)
                  clearError()
                }}
                placeholder="HIER-RO24"
                // En mayúsculas y sin corrector: es un código, no una palabra.
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                className="mt-1.5 text-center font-display text-2xl font-extrabold uppercase tracking-[0.12em]"
              />
            </div>

            <Button type="submit" className="w-full gap-2" disabled={joining || code.trim() === ''}>
              <Users className="size-4" />
              {joining ? 'Enviando…' : 'Unirme al equipo'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

interface JoinResultProps {
  outcome: JoinOutcome
  onEnter: () => void
}

/**
 * Qué ha pasado, dicho sin ambigüedad.
 *
 * Los tres desenlaces se leen distinto a propósito: quedarse esperando
 * aprobación no es lo mismo que estar dentro, y no decirlo claro haría que el
 * alumno volviera a escanear pensando que no funcionó.
 */
function JoinResult({ outcome, onEnter }: JoinResultProps) {
  const titles: Record<JoinOutcome['kind'], string> = {
    joined: 'Ya estás dentro',
    pending: 'Solicitud enviada',
    already: 'Ya eras de este equipo',
  }

  const descriptions: Record<JoinOutcome['kind'], string> = {
    joined: 'Tu entrenador ya puede asignarte entrenamientos y agendarte sesiones.',
    pending: 'Tu entrenador tiene que aceptarte. Te avisaremos en cuanto lo haga.',
    already: 'No hacía falta volver a escanear: sigues siendo miembro.',
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-bone px-6 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/45">
        {outcome.crew.denomination} · {outcome.crew.name}
      </p>
      <h1 className="font-display text-3xl font-extrabold uppercase leading-none tracking-tight text-ink">
        {titles[outcome.kind]}
      </h1>
      <p className="max-w-sm text-sm text-ink/55">{descriptions[outcome.kind]}</p>

      <Button className="mt-2" onClick={onEnter}>
        {outcome.kind === 'pending' ? 'Entendido' : 'Ver mi progreso'}
      </Button>
    </div>
  )
}
