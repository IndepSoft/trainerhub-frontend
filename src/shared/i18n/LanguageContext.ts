import { createContext, useContext } from 'react'
import type { Language } from './languages'
import type { TranslationKey } from './dictionaries/es'
import type { TranslationValues } from './translate'

/**
 * La funcion de traducir, suelta.
 *
 * Existe porque hay logica de derivacion FUERA de los componentes -`buildSummary`
 * del panel, los reductores del calendario- que produce texto para la pantalla.
 * Recibir `Translate` por parametro es lo que evita que esas funciones tengan
 * que ser componentes o que devuelvan claves a medio traducir.
 */
export type Translate = (key: TranslationKey, values?: TranslationValues) => string

export interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  /** Traduce una clave. Los huecos `{nombre}` se rellenan con `values`. */
  t: Translate
  /**
   * Traduce eligiendo entre singular y plural.
   *
   * Las dos claves se pasan explícitas en vez de derivar una de otra con un
   * sufijo: así el compilador comprueba que las dos existen, que es justo lo que
   * se pierde construyendo la clave en tiempo de ejecución.
   *
   * Vale para español, inglés y portugués, que reparten igual —uno frente a todo
   * lo demás—. Un idioma con dual, o con plural propio para el cero, necesitaría
   * otra cosa; entonces esto se cambia por `Intl.PluralRules` y las llamadas se
   * quedan como están.
   */
  plural: (
    one: TranslationKey,
    other: TranslationKey,
    count: number,
    values?: TranslationValues
  ) => string
}

/*
 * Sin valor por defecto a propósito: usar `useTranslation` fuera del proveedor
 * es un fallo de montaje, y un diccionario de reserva lo escondería hasta que
 * alguien notara que una pantalla no cambia de idioma.
 */
export const LanguageContext = createContext<LanguageContextValue | null>(null)

export function useTranslation(): LanguageContextValue {
  const value = useContext(LanguageContext)

  if (value === null) {
    throw new Error('useTranslation necesita LanguageProvider por encima')
  }

  return value
}
