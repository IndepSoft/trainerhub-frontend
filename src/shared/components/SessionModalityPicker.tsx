import { Dumbbell, Footprints, type LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import type { SessionModality } from '@/shared/domain/entities/session'

interface SessionModalityPickerProps {
  value: SessionModality
  onChange: (value: SessionModality) => void
}

/**
 * Fuerza o cardio, la elección que decide con qué pantalla se ejecuta la sesión.
 *
 * Vive en `shared` porque la usan los dos formularios que agendan —el de la
 * agenda y el de la ficha del alumno—, y la pregunta tiene que hacerse igual en
 * los dos: si una dijera «Sala / Calle» y la otra «Fuerza / Cardio», el
 * entrenador tendría que traducir.
 *
 * Dos conmutadores con `aria-pressed` y no un desplegable: son dos opciones y
 * cambian el resto del formulario —el cardio no ejecuta rutinas—, así que
 * conviene verlas las dos a la vez.
 */
export function SessionModalityPicker({ value, onChange }: SessionModalityPickerProps) {
  const { t } = useTranslation()

  return (
    <div role="group" aria-label={t('session.modality.label')} className="grid grid-cols-2 gap-2">
      <ModalityOption
        icon={Dumbbell}
        label={t('session.modality.strength')}
        isSelected={value === 'strength'}
        onSelect={() => onChange('strength')}
      />
      <ModalityOption
        icon={Footprints}
        label={t('session.modality.cardio')}
        isSelected={value === 'cardio'}
        onSelect={() => onChange('cardio')}
      />
    </div>
  )
}

interface ModalityOptionProps {
  icon: LucideIcon
  label: string
  isSelected: boolean
  onSelect: () => void
}

function ModalityOption({ icon: Icon, label, isSelected, onSelect }: ModalityOptionProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onSelect}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-action border px-3 text-xs font-bold uppercase tracking-[0.12em] transition-colors',
        isSelected
          ? 'border-ember/50 bg-ember/10 text-ember-deep'
          : 'border-cobalt-tint-3 text-ink/45 hover:border-cobalt/40 hover:text-ink'
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  )
}
