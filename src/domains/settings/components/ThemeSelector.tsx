import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { ChoiceRow } from './ChoiceRow'
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
 *
 * EN UNA FILA que dice cuál está puesto (§49): tres botones apilados se
 * llevaban 140 px de la pantalla para una decisión que se toma una vez.
 */
export function ThemeSelector() {
  const { t } = useTranslation()
  const { theme, setTheme } = useThemePreference()

  return (
    <ChoiceRow
      label={t('settings.theme')}
      /* `null` es «todavía no montado»: hasta que la librería lee el
         almacenamiento no hay preferencia, y la de fábrica es «sistema». */
      value={theme ?? 'system'}
      hint={t('settings.theme.systemHint')}
      onChange={setTheme}
      options={THEME_OPTIONS.map((option) => {
        const Icon = option.icon
        return {
          value: option.value,
          label: t(option.labelKey),
          icon: <Icon aria-hidden="true" className="size-4 shrink-0 text-ink/45" />,
        }
      })}
    />
  )
}
