import { ChoiceRow } from './ChoiceRow'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { LANGUAGES, LANGUAGE_NAMES } from '@/shared/i18n/languages'

/**
 * Elegir idioma.
 *
 * CADA IDIOMA SE OFRECE EN SU PROPIO IDIOMA —«English», no «Inglés»—. Quien
 * abre esta pantalla porque la aplicación está en una lengua que no entiende
 * necesita reconocer la suya, y traducir los nombres es justo lo que se lo
 * impide. Por eso la fila enseña el nombre nativo del que está puesto.
 *
 * Cambia al instante, sin botón de guardar: como el tema, el resultado se ve en
 * el mismo gesto.
 *
 * DÓNDE ACABA LA TRADUCCIÓN se dice al elegir, que es cuando importa: lo que
 * escribe la aplicación cambia, lo que escribió una persona no.
 */
export function LanguageSelector() {
  const { t, language, setLanguage } = useTranslation()

  return (
    <ChoiceRow
      label={t('settings.language')}
      value={language}
      hint={t('settings.language.hint')}
      onChange={setLanguage}
      options={LANGUAGES.map((candidate) => ({
        value: candidate,
        label: LANGUAGE_NAMES[candidate],
      }))}
    />
  )
}
