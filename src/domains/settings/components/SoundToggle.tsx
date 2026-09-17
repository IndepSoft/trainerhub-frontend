import { Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { useSoundPreference } from '@/shared/hooks/useSoundPreference'
import { playRestChime, primeRestChime } from '@/shared/lib/restChime'

/**
 * Encender o apagar el sonido de la aplicación.
 *
 * TODA LA FILA ES EL INTERRUPTOR, no sólo el rectángulo de la derecha. Un
 * objetivo táctil de 44 px que ocupa el ancho entero se acierta a la primera con
 * el pulgar; uno del tamaño del dibujo, no. Es la regla 1.6 aplicada a lo que
 * suele ser el control más pequeño de una pantalla de ajustes.
 *
 * `role="switch"` sobre un `<button>` y no una casilla: es un cambio que surte
 * efecto al tocarlo, no un campo que se envía con un formulario. El lector de
 * pantalla dice «activado» o «desactivado», que es exactamente el estado.
 *
 * SUENA AL ENCENDERLO. Un aviso sonoro que no se puede oír hasta que termine un
 * descanso de dos minutos es un ajuste a ciegas: aquí se elige el sonido y aquí
 * se oye. De paso, el toque desbloquea el audio del navegador, así que quien
 * pasa por Ajustes llega a la sesión con el aviso ya listo.
 *
 * Es una FILA como las demás (§49), y no una tarjeta con borde: lo que la
 * distingue es lo que hace, no el marco.
 */
export function SoundToggle() {
  const { t } = useTranslation()
  const { soundEnabled, setSoundEnabled } = useSoundPreference()

  const handleToggle = () => {
    const next = !soundEnabled
    setSoundEnabled(next)

    if (next) {
      primeRestChime()
      playRestChime()
    }
  }

  const Icon = soundEnabled ? Volume2 : VolumeX

  return (
    <li className="relative flex flex-col border-b border-cobalt-tint-3 py-3">
      <button
        type="button"
        role="switch"
        aria-checked={soundEnabled}
        onClick={handleToggle}
        className="flex min-h-11 items-center gap-3 text-start outline-none"
      >
        <Icon
          aria-hidden="true"
          className={cn('size-4 shrink-0', soundEnabled ? 'text-cobalt' : 'text-ink/40')}
        />

        <span className="min-w-0 flex-1 text-[15px] font-semibold leading-tight text-ink">
          {t('settings.sound.restChime')}
        </span>

        {/* Decorativo: el estado ya lo dice `aria-checked`, y anunciarlo dos
            veces haría que el lector leyera «activado activado». */}
        <span
          aria-hidden="true"
          className={cn(
            'relative h-6 w-11 shrink-0 rounded-full transition-colors',
            soundEnabled ? 'bg-cobalt' : 'bg-ink/20'
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 size-5 rounded-full bg-white transition-[left] duration-200',
              soundEnabled ? 'left-[1.375rem]' : 'left-0.5'
            )}
          />
        </span>
      </button>

      <p className="ms-7 mt-1 text-xs text-ink/45">
        {/* Las dos limitaciones que no se pueden arreglar desde aquí, dichas
            donde se decide: el silenciador del teléfono manda por encima de
            esto, y en iOS el sonido es el ÚNICO aviso que llega porque Apple
            nunca implementó la vibración en el navegador. */}
        {t('settings.sound.hint')}
      </p>
    </li>
  )
}
