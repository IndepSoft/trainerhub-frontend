import { Minus, Plus } from 'lucide-react'
import { Input } from '@/shared/ui/input'
import { cn } from '@/shared/lib/utils'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { formatKilos } from '@/shared/lib/routineFormat'

/**
 * Cuánto sube o baja cada toque, en kilos.
 *
 * 2,5 es el salto de un par de discos de 1,25, que es el incremento estándar en
 * una barra. Poner 1 obligaría a tres toques para el cambio más común, y poner 5
 * dejaría fuera la mitad de las progresiones.
 */
export const WEIGHT_STEP_KG = 2.5

interface SetWeightFieldProps {
  /** Kilos anotados, o `null` si todavía no se anotó ninguno. */
  weightKg: number | null
  onChange: (kilos: number | null) => void
  onAdjust: (delta: number) => void
  /** Lo que se levantó la última vez en este ejercicio, si se sabe. */
  lastWeightKg: number | null
  /** La carga de referencia que prescribió la rutina, si la prescribió. */
  prescribedKg: number | null
}

/**
 * El peso de la serie.
 *
 * SE AJUSTA A TOQUES, no se teclea. Entre serie y serie las manos están sudadas
 * y el teclado del móvil tapa media pantalla; dos botones de 2,5 kg resuelven el
 * caso normal —repetir la carga, o subir un disco— sin abrirlo. El campo sigue
 * ahí para el salto grande, o para el primer día de un ejercicio.
 *
 * SE OFRECE SIEMPRE, también en los ejercicios de peso corporal, y no es
 * descuido: las dominadas y los fondos son justo donde se añade carga con
 * cinturón. Esconderlo por el material se equivocaría en el caso que más lo
 * necesita. Sin anotar se guarda ausente, que no es lo mismo que cero.
 */
export function SetWeightField({
  weightKg,
  onChange,
  onAdjust,
  lastWeightKg,
  prescribedKg,
}: SetWeightFieldProps) {
  const { t } = useTranslation()

  const handleType = (value: string) => {
    const trimmed = value.trim().replace(',', '.')
    if (trimmed === '') {
      onChange(null)
      return
    }

    const kilos = Number(trimmed)
    // Un texto que no es un número se ignora en vez de dejar `NaN` en el
    // registro: media palabra escrita no es una medición.
    if (Number.isNaN(kilos) || kilos < 0) return
    onChange(kilos)
  }

  return (
    <div>
      <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">
        {t('liveSession.weight')}
      </span>

      <div className="mt-1.5 flex items-center gap-2">
        <button
          type="button"
          aria-label={t('liveSession.weightDown', { step: formatKilos(WEIGHT_STEP_KG) })}
          onClick={() => onAdjust(-WEIGHT_STEP_KG)}
          disabled={weightKg === null || weightKg === 0}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-action border border-cobalt-tint-3 text-ink/60 transition-colors hover:border-cobalt/50 hover:text-cobalt disabled:pointer-events-none disabled:opacity-30"
        >
          <Minus className="size-4" strokeWidth={2.5} />
        </button>

        <div className="relative min-w-0 flex-1">
          <Input
            inputMode="decimal"
            aria-label={t('liveSession.weight')}
            value={weightKg === null ? '' : formatKilos(weightKg)}
            onChange={(event) => handleType(event.target.value)}
            placeholder="—"
            className="metric-figures h-11 pe-9 text-center text-lg font-bold"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink/35"
          >
            {t('liveSession.kilos')}
          </span>
        </div>

        <button
          type="button"
          aria-label={t('liveSession.weightUp', { step: formatKilos(WEIGHT_STEP_KG) })}
          onClick={() => onAdjust(WEIGHT_STEP_KG)}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-action border border-cobalt-tint-3 text-ink/60 transition-colors hover:border-cobalt/50 hover:text-cobalt"
        >
          <Plus className="size-4" strokeWidth={2.5} />
        </button>
      </div>

      {/* De dónde sale la cifra que aparece sola. Un campo que se rellena solo y
          no dice por qué se lee como un dato inventado. */}
      {lastWeightKg !== null && (
        <p
          className={cn(
            'mt-1 text-xs',
            weightKg !== null && weightKg > lastWeightKg ? 'text-success' : 'text-ink/45'
          )}
        >
          {t('liveSession.lastWeight', { weight: formatKilos(lastWeightKg) })}
        </p>
      )}

      {/*
        Lo prescrito, cuando dice algo que la otra línea no dice ya.

        Se calla si coincide con la última vez, que es el caso corriente en
        cuanto alguien lleva dos sesiones: repetir la misma cifra con dos
        nombres distintos hace dudar de si son dos datos.

        Y se enseña aunque el campo no arranque de aquí. La instrucción del
        entrenador tiene que estar a la vista incluso cuando el historial manda:
        es la única forma de que una bajada deliberada —una semana de descarga—
        se pueda seguir.
      */}
      {prescribedKg !== null && prescribedKg !== lastWeightKg && (
        <p className="mt-1 text-xs text-ink/45">
          {t('liveSession.prescribedWeight', { weight: formatKilos(prescribedKg) })}
        </p>
      )}
    </div>
  )
}
