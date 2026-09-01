import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { PageHeader } from '@/shared/components/PageHeader'
import { cn } from '@/shared/lib/utils'
import { useAuthStore } from '@/app/stores/authStore'
import { useViewerContext } from '@/app/ViewerContext'
import { useCrewEditor } from '../hooks/useCrewEditor'
import { CREW_DENOMINATIONS, type CrewDenomination } from '@/shared/domain/entities/crew'

const FIELD_LABEL = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60'

/**
 * Crear un equipo.
 *
 * ES LO PRIMERO QUE HACE UN ENTRENADOR. Sin crew no hay dónde meter alumnos,
 * rutinas ni sesiones: todo pertenece a uno, así que la aplicación no tiene nada
 * que enseñar hasta que existe.
 *
 * LA DENOMINACIÓN LA ELIGE ÉL. Un box de crossfit, una tribu de running y un
 * gimnasio de barrio no se llaman igual, y obligar a los tres a decir «club»
 * hace que la aplicación suene a otra cosa. Es sólo la etiqueta visible: el tipo
 * se llama `Crew` en código y no cambia.
 */
export default function NewCrew() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { selectCrew } = useViewerContext()
  const { createCrew, saving, error } = useCrewEditor()

  const [name, setName] = useState('')
  const [denomination, setDenomination] = useState<CrewDenomination>('Crew')
  const [missingName, setMissingName] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (name.trim() === '') {
      setMissingName(true)
      return
    }
    if (user === null) return

    const crew = await createCrew({
      name: name.trim(),
      denomination,
      ownerId: user.id,
    })

    if (crew === null) return

    // Se entra en el crew recién creado: es lo único que se puede querer
    // después de crearlo, y sin esto el ámbito seguiría en el anterior o vacío.
    selectCrew(crew.id)
    navigate('/crew')
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      <PageHeader className="pb-4">
        <PageHeader.Eyebrow>Tu equipo</PageHeader.Eyebrow>
        <PageHeader.Title>Crear</PageHeader.Title>
      </PageHeader>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-md space-y-6 px-5 py-6">
          <p className="text-sm text-ink/60">
            Tus alumnos, tus rutinas y tu agenda pertenecen a un equipo. Nadie de
            fuera los ve.
          </p>

          {error !== null && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor="crew-nombre" className={FIELD_LABEL}>
                  Nombre
                </Label>
                {missingName && (
                  <span className="text-[11px] font-semibold text-danger">
                    Falta este campo
                  </span>
                )}
              </div>
              <Input
                id="crew-nombre"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setMissingName(false)
                }}
                placeholder="Hierro y Asfalto"
                className={cn('mt-1.5', missingName && 'border-danger')}
              />
            </div>

            <div role="group" aria-label="Cómo lo llamas">
              <span className={cn('block', FIELD_LABEL)}>Cómo lo llamas</span>
              <p className="mt-1 text-xs text-ink/45">
                Sólo cambia cómo aparece escrito en la aplicación.
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {CREW_DENOMINATIONS.map((candidate) => {
                  const isSelected = candidate === denomination

                  return (
                    <button
                      key={candidate}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setDenomination(candidate)}
                      className={cn(
                        'inline-flex min-h-11 items-center rounded-action border px-3 text-xs font-semibold transition-colors',
                        isSelected
                          ? 'border-cobalt/50 bg-cobalt-tint text-cobalt'
                          : 'border-cobalt-tint-3 text-ink/50 hover:border-cobalt/40 hover:text-ink'
                      )}
                    >
                      {candidate}
                    </button>
                  )
                })}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'Creando…' : 'Crear equipo'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
