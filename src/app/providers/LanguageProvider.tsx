import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  LANGUAGE_TAGS,
  detectLanguage,
  isLanguage,
  type Language,
} from '@/shared/i18n/languages'
import { setActiveLanguage } from '@/shared/i18n/activeLocale'
import { fillPlaceholders, type TranslationValues } from '@/shared/i18n/translate'
import { DICTIONARIES } from '@/shared/i18n/dictionaries'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'
import { LanguageContext, type LanguageContextValue } from '@/shared/i18n/LanguageContext'

/**
 * Dónde se guarda el idioma elegido.
 *
 * Como el tema, lo lee también el guion en línea de `index.html`, que pone el
 * atributo `lang` en `<html>` antes del primer pintado.
 */
export const LANGUAGE_STORAGE_KEY = 'trainerhub.idioma'

/**
 * La primera vez, el idioma lo dice el navegador.
 *
 * Preguntarlo sería peor: quien abre la aplicación con el teléfono en portugués
 * ya respondió a esa pregunta al configurar el teléfono. El selector de ajustes
 * está para cambiarlo, no para tener que empezar por él.
 */
function initialLanguage(): Language {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (isLanguage(stored)) return stored
  } catch {
    // Sin almacenamiento se detecta en cada arranque. Es una preferencia, no un
    // dato: perderla no rompe nada.
  }

  return detectLanguage(window.navigator.languages ?? [window.navigator.language])
}

interface LanguageProviderProps {
  children: React.ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(initialLanguage)

  /*
   * Durante el render y no en un efecto. `setActiveLanguage` alimenta a las
   * funciones de fecha que viven fuera de React —ver `activeLocale.ts`—, y con
   * esto en un efecto el primer render formateaba con el idioma anterior y se
   * veía cambiar. Es idempotente: escribe el mismo valor cada vez.
   */
  setActiveLanguage(language)

  useEffect(() => {
    /*
     * `lang` no es decoración: de él dependen el lector de pantalla para elegir
     * la voz y el navegador para partir palabras al final de línea. Estaba fijo
     * en `es` dentro del HTML.
     */
    document.documentElement.lang = LANGUAGE_TAGS[language]

    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    } catch {
      // Ver arriba.
    }
  }, [language])

  const setLanguage = useCallback((next: Language) => {
    setActiveLanguage(next)
    setLanguageState(next)
  }, [])

  const value = useMemo<LanguageContextValue>(() => {
    /*
     * Sin diccionario de reserva: `Dictionary` obliga a que los tres idiomas
     * tengan TODAS las claves, así que una que falte no compila. Un `??` aquí
     * sería código muerto que además daría la impresión de que faltar es un
     * estado posible.
     */
    const dictionary = DICTIONARIES[language]

    const translate = (key: TranslationKey, values?: TranslationValues): string =>
      fillPlaceholders(dictionary[key], values)

    return {
      language,
      setLanguage,
      t: translate,
      plural: (one, other, count, values) => translate(count === 1 ? one : other, values),
    }
  }, [language, setLanguage])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
