import { ArrowLeft } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { AuthHeroBackdrop } from './AuthHeroBackdrop'

/**
 * Cuánto ocupa la imagen EN MÓVIL. Se elige por lo que viene debajo: cuanto más
 * largo el formulario, menos foto, para que en un teléfono de 667 px el botón
 * de envío quede a la vista sin desplazar.
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

/**
 * En escritorio la altura NO SE ELIGE: la imagen ocupa su mitad entera. Los
 * tres tamaños de arriba son una decisión de móvil —repartir una pantalla alta
 * y estrecha entre foto y campos— y en una ventana ancha no significan nada.
 */
const DESKTOP_HEIGHT = 'lg:h-full lg:min-h-0 lg:max-h-none'

/**
 * El corte diagonal de la imagen, que es la cuña de las tarjetas.
 *
 * CAMBIA DE BORDE CON LA COMPOSICIÓN: en móvil corta ABAJO, porque la imagen
 * es una banda horizontal y el formulario viene debajo; en escritorio corta a
 * la DERECHA, que es el borde que da al formulario. El mismo gesto aplicado al
 * lado por el que se toca lo que viene después.
 *
 * Va en clases y no en el atributo `style` —donde estaba— por una razón
 * mecánica: `style` no sabe de puntos de ruptura, y esto tiene que ser distinto
 * en cada uno. Los `_` son los espacios del `polygon`, que es como Tailwind
 * admite un valor con espacios.
 */
const IMAGE_CLIP =
  '[clip-path:polygon(0_0,100%_0,100%_85%,0_100%)] lg:[clip-path:polygon(0_0,100%_0,88%_100%,0_100%)]'

/**
 * La banda Ember apoyada en el filo, paralela al corte y un poco por fuera para
 * que asome hacia el formulario. Su caja se sale del bloque a propósito —abajo
 * en móvil, a la derecha en escritorio—: si no, no habría nada que asomara.
 */
const BAND_CLIP =
  '[clip-path:polygon(0_84%,100%_5%,100%_21%,0_100%)] lg:[clip-path:polygon(97%_0,100%_0,88%_100%,85%_100%)]'

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
  /**
   * Clases del contenedor. Existe para las pantallas que sólo enseñan la imagen
   * en escritorio, porque en móvil ya traen su propia cabecera: el segundo paso
   * del alta de entrenador es el caso.
   */
  className?: string
}

/**
 * El bloque de imagen con el que arrancan las pantallas de acceso.
 *
 * ES LA PANTALLA ANTERIOR AL ONBOARDING, y habla su mismo idioma: Ink, la
 * banda Ember, Condensed enorme. Lo que había —una tarjeta blanca centrada con
 * pestañas— era el aspecto de fábrica de la librería, y no se parecía a nada
 * de lo que viene después.
 *
 * Se recorta la IMAGEN, no el contenedor, para que la banda Ember pueda
 * apoyarse en el filo y asomar por debajo sin que el contenedor la corte.
 *
 * El texto va siempre en blanco, no en `bone`: el fondo es una imagen oscura
 * en los dos temas, y `bone` en modo oscuro es casi negro.
 */
export function AuthHero({ eyebrow, headlineLines, height, back, className }: AuthHeroProps) {
  return (
    <header
      className={cn(
        'relative shrink-0 text-white',
        HEIGHT_CLASS[height],
        DESKTOP_HEIGHT,
        className
      )}
    >
      <div aria-hidden="true" className={cn('absolute inset-0 overflow-hidden bg-ink', IMAGE_CLIP)}>
        <AuthHeroBackdrop />
      </div>

      {/* La caja se sale del bloque por el lado del filo: abajo en móvil, a la
          derecha en escritorio. El relleno sólo se pinta dentro de la caja, así
          que sin ese desbordamiento la banda no asomaría. */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-x-0 top-[84%] h-[19%] bg-ember',
          'lg:inset-y-0 lg:left-0 lg:-right-[3%] lg:h-auto',
          BAND_CLIP
        )}
      />

      <div className="absolute inset-x-4 top-3 flex h-11 items-center lg:inset-x-10 lg:top-8">
        {back === undefined ? (
          <span className="pl-2 font-display text-lg font-extrabold uppercase leading-none tracking-tight lg:pl-0 lg:text-xl">
            TrainerHub
          </span>
        ) : (
          <button
            type="button"
            aria-label={back.label}
            onClick={back.onClick}
            className="-ml-1 inline-flex size-11 items-center justify-center rounded-action transition-colors hover:bg-white/10 lg:-ml-3"
          >
            <ArrowLeft className="size-6" strokeWidth={2.25} />
          </button>
        )}
      </div>

      {/*
        En escritorio el titular se despega del filo con relleno a la derecha:
        la diagonal se come la esquina, y una línea larga acabaría cortada por
        el corte de la imagen.
      */}
      <div className="absolute inset-x-6 bottom-[22%] flex flex-col gap-3 lg:inset-x-10 lg:bottom-[14%] lg:gap-5 lg:pr-[14%]">
        <p className="font-display text-sm font-bold uppercase tracking-[0.3em] text-ember lg:text-base">
          {eyebrow}
        </p>
        <h1 className="font-display text-[3.25rem] font-extrabold uppercase leading-[0.88] tracking-tight lg:text-[4rem] xl:text-[4.75rem]">
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
