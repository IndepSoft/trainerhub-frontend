import type { Language } from '../languages'
import { spanish, type Dictionary } from './es'
import { english } from './en'
import { portuguese } from './pt'

/**
 * Los tres diccionarios, cargados de una vez.
 *
 * NO SE CARGAN BAJO DEMANDA, a propósito. Los tres juntos pesan unos pocos
 * kilobytes comprimidos; partirlos obligaría a que cada pantalla supiera esperar
 * a su diccionario, y en una PWA que arranca sin conexión el idioma guardado
 * tiene que estar disponible ya. Cuando el texto crezca hasta que esto importe,
 * el sitio del cambio es este fichero y ningún otro.
 */
export const DICTIONARIES: Record<Language, Dictionary> = {
  es: spanish,
  en: english,
  pt: portuguese,
}
