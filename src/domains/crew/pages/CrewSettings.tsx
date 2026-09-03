import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { PageHeader } from '@/shared/components/PageHeader'
import { cn } from '@/shared/lib/utils'
import { useViewerContext } from '@/app/ViewerContext'
import { useCrewEditor } from '../hooks/useCrewEditor'
import { NotAllowedHere } from '../components/NotAllowedHere'
import { CREW_DENOMINATIONS, type CrewDenomination } from '@/shared/domain/entities/crew'
import { useTranslation } from '@/shared/i18n/LanguageContext'

const FIELD_LABEL = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60'

/**
 * Los ajustes del equipo.
 *
 * ES LA PANTALLA QUE LE FALTABA A `crew.settings`. La capacidad existía desde
 * que se separaron gobernar y entrenar, y no la comprobaba nadie porque no había
 * dónde: se declaraba un poder que no abría ninguna puerta.
 *
 * Aquí están las tres decisiones que distinguen a un equipo de otro y que no son
 * datos de entrenamiento: cómo se llama, si la entrada pasa por aprobación, y si
 * se compite. Las tres las cambia quien gobierna, no quien entrena.
 */
export default function CrewSettings() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { active, can, loading: loadingViewer } = useViewerContext()
  const { updateCrew, saving, error } = useCrewEditor()

  const crew = active?.crew ?? null

  const [name, setName] = useState(crew?.name ?? '')
  const [denomination, setDenomination] = useState<CrewDenomination>(
    crew?.denomination ?? 'Crew'
  )
  const [requiresApproval, setRequiresApproval] = useState(crew?.requiresApproval ?? true)
  const [rankingEnabled, setRankingEnabled] = useState(crew?.rankingEnabled ?? true)
  const [missingName, setMissingName] = useState(false)

  if (loadingViewer) return null
  if (crew === null || !can('crew.settings')) {
    return (
      <NotAllowedHere description={t('crew.settingsNotAllowed')} />
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (name.trim() === '') {
      setMissingName(true)
      return
    }

    await updateCrew(crew.id, {
      name: name.trim(),
      denomination,
      requiresApproval,
      rankingEnabled,
    })
    navigate('/crew')
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      <PageHeader className="pb-4">
        <PageHeader.Eyebrow>{crew.name}</PageHeader.Eyebrow>
        <PageHeader.Title>{t('crew.settings')}</PageHeader.Title>
      </PageHeader>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-md space-y-6 px-5 py-6">
          {error !== null && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor="ajustes-nombre" className={FIELD_LABEL}>
                  {t('crew.name')}
                </Label>
                {missingName && (
                  <span className="text-[11px] font-semibold text-danger">
                    {t('common.missingField')}
                  </span>
                )}
              </div>
              <Input
                id="ajustes-nombre"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setMissingName(false)
                }}
                className={cn('mt-1.5', missingName && 'border-danger')}
              />
            </div>

            <div role="group" aria-label={t('crew.denomination')}>
              <span className={cn('block', FIELD_LABEL)}>{t('crew.denomination')}</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {CREW_DENOMINATIONS.map((candidate) => (
                  <button
                    key={candidate}
                    type="button"
                    aria-pressed={candidate === denomination}
                    onClick={() => setDenomination(candidate)}
                    className={cn(
                      'inline-flex min-h-11 items-center rounded-action border px-3 text-xs font-semibold transition-colors',
                      candidate === denomination
                        ? 'border-cobalt/50 bg-cobalt-tint text-cobalt'
                        : 'border-cobalt-tint-3 text-ink/50 hover:border-cobalt/40 hover:text-ink'
                    )}
                  >
                    {candidate}
                  </button>
                ))}
              </div>
            </div>

            <SettingToggle
              label={t('crew.approvalLabel')}
              description={t('crew.approvalHint')}
              checked={requiresApproval}
              onToggle={() => setRequiresApproval((current) => !current)}
            />

            <SettingToggle
              label={t('crew.rankingLabel')}
              description={t('crew.rankingHint')}
              checked={rankingEnabled}
              onToggle={() => setRankingEnabled((current) => !current)}
            />

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => navigate('/crew')}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

interface SettingToggleProps {
  label: string
  description: string
  checked: boolean
  onToggle: () => void
}

/**
 * Un ajuste de sí o no, con su consecuencia escrita al lado.
 *
 * La descripción no repite la etiqueta: dice QUÉ PASA si se apaga. «Aprobar
 * quién entra» no le explica a nadie que desactivarlo convierte un QR
 * fotografiado en una puerta abierta.
 */
function SettingToggle({ label, description, checked, onToggle }: SettingToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      className="flex w-full min-h-11 items-start gap-3 rounded-block border border-cobalt-tint-3 p-3 text-start transition-colors hover:border-cobalt/40"
    >
      <span
        aria-hidden="true"
        className={cn(
          'mt-0.5 flex h-6 w-10 shrink-0 items-center rounded-action p-0.5 transition-colors',
          checked ? 'bg-cobalt' : 'bg-cobalt-tint-3'
        )}
      >
        <span
          className={cn(
            'size-5 rounded-action bg-surface transition-transform',
            checked && 'translate-x-4'
          )}
        />
      </span>

      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="block text-xs text-ink/50">{description}</span>
      </span>
    </button>
  )
}
