/**
 * Si la aplicación puede sonar. Almacén externo, sin React.
 *
 * HOY EL ÚNICO SONIDO ES EL AVISO DE FIN DE DESCANSO —ver `restChime.ts`—, y aun
 * así la preferencia se llama «sonido» y no «aviso de descanso»: quien va a
 * Ajustes a callar la aplicación quiere callarla entera, y una lista de
 * interruptores por cada ruido que se añada es una pantalla que nadie termina de
 * leer. Cuando haya un segundo sonido, entrará bajo este mismo interruptor.
 *
 * ES UN ALMACÉN Y NO UN `useState` porque tiene dos lectores en sitios distintos
 * —el interruptor de Ajustes y la sesión en vivo— y ninguno cuelga del otro.
 * Con estado local, cambiarlo en Ajustes dejaría a la sesión con el valor viejo
 * hasta recargar.
 *
 * ENCENDIDO DE FÁBRICA. Es la decisión que hacía falta tomar para que esto
 * existiera: un aviso apagado por defecto no lo descubre nadie, y el motivo por
 * el que no se ponía —que no se pudiera callar— deja de aplicar en cuanto hay
 * dónde callarlo. Por debajo sigue mandando el silenciador del teléfono.
 */

export const SOUND_STORAGE_KEY = 'trainerhub.sonido'

/** Lo que se guarda. Palabras y no `true`/`false`: se lee en el inspector. */
const STORED_ON = 'on'
const STORED_OFF = 'off'

const listeners = new Set<() => void>()

/*
 * Lo leído, recordado. `useSyncExternalStore` llama a `getSnapshot` en cada
 * renderizado y compara el resultado con el anterior: tocar `localStorage` ahí
 * cada vez sería un acceso síncrono al disco por render, y además innecesario,
 * porque este módulo es el único que escribe la clave.
 */
let cached: boolean | null = null

function readStored(): boolean {
  try {
    const stored = window.localStorage.getItem(SOUND_STORAGE_KEY)
    // Sin nada guardado, encendido: es la preferencia de fábrica.
    return stored === null ? true : stored === STORED_ON
  } catch {
    // En navegación privada el acceso puede lanzar. El aviso importa menos que
    // la pantalla, así que se contesta lo de fábrica y se sigue.
    return true
  }
}

export function readSoundPreference(): boolean {
  if (cached === null) cached = readStored()
  return cached
}

export function setSoundPreference(enabled: boolean): void {
  cached = enabled

  try {
    window.localStorage.setItem(SOUND_STORAGE_KEY, enabled ? STORED_ON : STORED_OFF)
  } catch {
    // Se pierde al recargar, pero la sesión en curso obedece igual: es mejor
    // que un interruptor que no hace nada.
  }

  for (const listener of listeners) listener()
}

/**
 * Avisa de los cambios. Devuelve cómo dejar de escuchar.
 *
 * Escucha también el evento `storage`, que es el que llega cuando la preferencia
 * cambia en OTRA pestaña. Sin eso, dos pestañas abiertas —la sesión en una,
 * Ajustes en la otra, que es exactamente cómo se apaga un pitido molesto—
 * discreparían hasta recargar.
 */
export function subscribeToSoundPreference(listener: () => void): () => void {
  listeners.add(listener)

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== SOUND_STORAGE_KEY) return
    cached = readStored()
    listener()
  }

  window.addEventListener('storage', handleStorage)

  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', handleStorage)
  }
}
