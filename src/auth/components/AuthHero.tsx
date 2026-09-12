import { ArrowLeft } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { AuthHeroBackdrop } from './AuthHeroBackdrop'

/**
 * Cuánto ocupa la imagen. Se elige por lo que viene debajo: cuanto más largo
 * el formulario, menos foto, para que en un móvil de 667 px el botón de envío
 * quede a la vista sin desplazar.
 */
export type AuthHeroHeight = 'tall' | 'medium' | 'short'

/**
 * En unidades de la ventana con tope por arriba y por abajo: en un teléfono
 * bajo cede sitio al formulario; en uno alto no se estira hasta parecer un
 * cartel. Los topes son los tamaños con los que se compuso la propuesta.
 */
const HEIGHT_CLASS: Record<AuthHeroHeight, string> = {
  tall: 'h-[50dvh] min-h-[300px] max-h-[420px]',
  medium: 'h-[40dvh] min-h-[260px] max-h-[340px]',
  short: 'h-[32dvh] min-h-[220px] max-h-[280px]',
}

interface AuthHeroBack {
  label: string
  onClick: () => void
}

interface AuthHeroProps {
  eyebrow: string
  /**
   * El titular, ya partido en líneas. Dónde corta una frase es una decisión de
   * composición, y dejársela al ancho disponible produce viudas y cortes en
   * mitad de una idea. Mismo criterio que en el onboarding.
   */
  headlineLines: string[]
  height: AuthHeroHeight
  /** Si se pasa, la esquina lleva «atrás» en vez de la marca. */
  back?: AuthHeroBack
}

/**
 * El bloque de imagen a sangre con el que arrancan las pantallas de acceso.
 *
 * ES LA PANTALLA ANTERIOR AL ONBOARDING, y habla su mismo idioma: Ink, la
 * banda Ember, Condensed enorme. Lo que había —una tarjeta blanca centrada con
 * pestañas— era el aspecto de fábrica de la librería, y no se parecía a nada
 * de lo que viene después.
 *
 * EL CORTE DIAGONAL ES LA CUÑA DE LAS TARJETAS, la misma que llevan la ficha
 * del alumno y la sesión: `polygon` que sube hacia la derecha. Se recorta la
 * IMAGEN, no el contenedor, para que la banda Ember pueda apoyarse en el filo
 * y asomar por debajo sin que el contenedor la corte.
 *
 * El texto va siempre en blanco, no en `bone`: el fondo es una imagen oscura
 * en los dos temas, y `bone` en modo oscuro es casi negro.
 */
export function AuthHero({ eyebrow, headlineLines, height, back }: AuthHeroProps) {
  return (
    <header className={cn('relative shrink-0 text-white', HEIGHT_CLASS[height])}>
      <div
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden bg-ink"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 100%)' }}
      >
        <AuthHeroBackdrop />
      </div>

      {/* La banda apoyada en el filo: paralela al corte de arriba y un poco
          más abajo, para que sobresalga hacia el formulario. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[84%] h-[19%] bg-ember"
        style={{ clipPath: 'polygon(0 84%, 100% 5%, 100% 21%, 0 100%)' }}
      />

      <div className="absolute inset-x-4 top-3 flex h-11 items-center">
        {back === undefined ? (
          <span className="pl-2 font-display text-lg font-extrabold uppercase leading-none tracking-tight">
            TrainerHub
          </span>
        ) : (
          <button
            type="button"
            aria-label={back.label}
            onClick={back.onClick}
            className="-ml-1 inline-flex size-11 items-center justify-center rounded-action transition-colors hover:bg-white/10"
          >
            <ArrowLeft className="size-6" strokeWidth={2.25} />
          </button>
        )}
      </div>

      <div className="absolute inset-x-6 bottom-[22%] flex flex-col gap-3">
        <p className="font-display text-sm font-bold uppercase tracking-[0.3em] text-ember">
          {eyebrow}
        </p>
        <h1 className="font-display text-[3.25rem] font-extrabold uppercase leading-[0.88] tracking-tight">
          {headlineLines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h1>
      </div>
    </header>
  )
}
