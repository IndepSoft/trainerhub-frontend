import { useSyncExternalStore } from 'react'
import {
  readSoundPreference,
  setSoundPreference,
  subscribeToSoundPreference,
} from '@/shared/lib/soundPreference'

interface UseSoundPreferenceResult {
  /** Si la aplicación puede sonar. Encendido de fábrica. */
  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
}

/**
 * La preferencia de sonido, viva.
 *
 * `useSyncExternalStore` y no un `useState` con un efecto: el valor vive fuera
 * de React —en `localStorage`, y compartido entre pestañas— y ésta es la
 * primitiva que existe para eso. Con estado propio, apagar el sonido desde
 * Ajustes no llegaría a la sesión que está corriendo en otra pestaña, que es la
 * que suena.
 *
 * No hace falta instantánea de servidor: aquí no se renderiza en servidor, y el
 * valor de fábrica no depende del almacenamiento.
 */
export function useSoundPreference(): UseSoundPreferenceResult {
  const soundEnabled = useSyncExternalStore(subscribeToSoundPreference, readSoundPreference)

  return { soundEnabled, setSoundEnabled: setSoundPreference }
}
