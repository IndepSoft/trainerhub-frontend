import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { useThemePreference, type AppTheme } from '@/shared/hooks/useThemePreference'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'

interface ThemeOption {
  value: AppTheme
  labelKey: TranslationKey
  icon: LucideIcon
}

const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light', labelKey: 'settings.theme.light', icon: Sun },
  { value: 'dark', labelKey: 'settings.theme.dark', icon: Moon },
  { value: 'system', labelKey: 'settings.theme.system', icon: Monitor },
]

/**
 * Elegir tema.
 *
 * Tres opciones y no un interruptor: «sistema» es la tercera y es la de fábrica,
 * porque quien tiene el teléfono en modo noche espera que las aplicaciones lo
 * respeten sin tener que decírselo a cada una.
 *
 * El cambio es INMEDIATO y no se guarda con un botón. Es una preferencia visual:
 * el resultado se ve en el mismo gesto, así que pedir confirmación de algo que
 * ya está a la vista sobra.
 */
export function ThemeSelector() {
  const { t } = useTranslation()
  const { theme, setTheme } = useThemePreference()

  return (
    <div role="group" aria-label={t('settings.theme')}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon
          const selected = theme === option.value

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => setTheme(option.value)}
              className={cn(
                'flex min-h-11 items-center justify-center gap-2 rounded-action border px-3 text-xs font-semibold transition-colors',
                selected
                  ? 'border-cobalt/50 bg-cobalt-tint text-cobalt'
                  : 'border-cobalt-tint-3 text-ink/50 hover:border-cobalt/40 hover:text-ink'
              )}
            >
              <Icon className="size-4 shrink-0" />
              {t(option.labelKey)}
            </button>
          )
        })}
      </div>

      <p className="mt-2 text-xs text-ink/45">
        {/* El porqué de que exista «sistema», dicho donde se elige. */}
        {t('settings.theme.systemHint')}
      </p>
    </div>
  )
}
