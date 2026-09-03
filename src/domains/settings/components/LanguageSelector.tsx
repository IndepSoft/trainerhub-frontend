import { Check } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { LANGUAGES, LANGUAGE_NAMES } from '@/shared/i18n/languages'

/**
 * Elegir idioma.
 *
 * CADA IDIOMA SE OFRECE EN SU PROPIO IDIOMA —«English», no «Inglés»—. Quien
 * abre esta pantalla porque la aplicación está en una lengua que no entiende
 * necesita reconocer la suya, y traducir los nombres es justo lo que se lo
 * impide.
 *
 * Cambia al instante, sin botón de guardar: como el tema, el resultado se ve en
 * el mismo gesto.
 */
export function LanguageSelector() {
  const { t, language, setLanguage } = useTranslation()

  return (
    <div role="group" aria-label={t('settings.language')}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {LANGUAGES.map((candidate) => {
          const selected = candidate === language

          return (
            <button
              key={candidate}
              type="button"
              aria-pressed={selected}
              onClick={() => setLanguage(candidate)}
              className={cn(
                'flex min-h-11 items-center justify-center gap-2 rounded-action border px-3 text-xs font-semibold transition-colors',
                selected
                  ? 'border-cobalt/50 bg-cobalt-tint text-cobalt'
                  : 'border-cobalt-tint-3 text-ink/50 hover:border-cobalt/40 hover:text-ink'
              )}
            >
              <Check
                aria-hidden="true"
                className={cn('size-4 shrink-0', selected ? 'opacity-100' : 'opacity-0')}
              />
              {LANGUAGE_NAMES[candidate]}
            </button>
          )
        })}
      </div>

      <p className="mt-2 text-xs text-ink/45">
        {/* Dónde acaba la traducción: lo que escribe la aplicación cambia, lo
            que escribió una persona no. Sin decirlo, el primer alumno con el
            idioma en inglés esperaría ver sus rutinas traducidas. */}
        {t('settings.language.hint')}
      </p>
    </div>
  )
}
