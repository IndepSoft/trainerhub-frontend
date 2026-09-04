/**
 * Vibración del dispositivo.
 *
 * ATENCIÓN, LIMITACIÓN REAL DE PLATAFORMA: `navigator.vibrate` **no existe en
 * Safari ni en una PWA instalada en iOS**. Apple nunca implementó la Vibration
 * API. Por eso esta función devuelve un booleano en vez de `void`: quien la
 * llama sabe si hubo respuesta háptica y puede compensar con una señal visual
 * o sonora. No se debe asumir que la vibración ocurrió.
 *
 * Se detecta la capacidad en cada llamada y no una sola vez al cargar, porque
 * el módulo puede evaluarse durante el renderizado en servidor o en un entorno
 * de pruebas donde `navigator` no existe todavía.
 */

/** Patrones con nombre, para que en el sitio de llamada se lea la intención y no una lista de milisegundos. */
export const HapticPattern = {
  /** Confirmación breve: un toque que registra. */
  TAP: 12,
  /** Cambio de estado: pausar, reanudar. */
  TRANSITION: [18, 40, 18],
  /** Celebración: logro desbloqueado, meta cumplida. */
  CELEBRATE: [24, 60, 24, 60, 60],
} as const

export type HapticPatternValue = number | readonly number[]

export function vibrate(pattern: HapticPatternValue): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return false
  }

  // Algunos navegadores rechazan la llamada si el documento no está visible o
  // si no hubo interacción previa del usuario; devuelven `false` en vez de
  // lanzar, pero se protege igualmente.
  try {
    return navigator.vibrate(pattern as number | number[])
  } catch {
    return false
  }
}
