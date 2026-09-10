import { Link } from 'react-router-dom'
import { Check, Circle } from 'lucide-react'
import { SectionHeading } from './SectionHeading'
import { useFirstSteps } from '../hooks/useFirstSteps'
import { cn } from '@/shared/lib/utils'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import type { Crew } from '@/shared/domain/entities/crew'

interface FirstStepsProps {
  crew: Crew | null
}

/**
 * La lista de lo que falta para que el equipo funcione. Se quita sola cuando
 * está todo hecho, así que un equipo en marcha nunca la ve.
 *
 * Numerada porque ES una secuencia: sin equipo no hay activación que pedir,
 * sin activación no entran alumnos, y sin alumnos no hay a quién agendar.
 */
export function FirstSteps({ crew }: FirstStepsProps) {
  const { t } = useTranslation()
  const { steps, hasPending, loading } = useFirstSteps(crew)

  if (loading || !hasPending) return null

  return (
    <section className="px-5 pt-6">
      <SectionHeading count={steps.filter((step) => !step.done).length}>
        {t('dashboard.firstSteps')}
      </SectionHeading>
      <p className="pt-2 text-xs text-ink/45">{t('firstSteps.hint')}</p>

      <ol className="mt-3 divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3">
        {steps.map((step, index) => (
          <li key={step.id}>
            <Link
              to={step.to}
              aria-disabled={step.done}
              className={cn(
                'flex min-h-11 items-center gap-3 py-2 text-sm transition-colors',
                step.done ? 'text-ink/40' : 'text-ink hover:text-cobalt'
              )}
            >
              <span className="metric-figures w-5 shrink-0 text-xs font-bold text-cobalt">
                {String(index + 1).padStart(2, '0')}
              </span>
              {step.done ? (
                <Check aria-label={t('firstSteps.done')} className="size-4 shrink-0 text-success" />
              ) : (
                <Circle aria-hidden="true" className="size-4 shrink-0 text-ink/30" />
              )}
              <span className={cn('flex-1', step.done && 'line-through')}>{t(step.labelKey)}</span>
              {step.noteKey !== undefined && (
                <span className="text-xs text-ink/45">{t(step.noteKey)}</span>
              )}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
