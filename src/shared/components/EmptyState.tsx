import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  /** Qué falta, en tres palabras. */
  title: string
  /** Qué es lo que va aquí y cómo se consigue. */
  body: string
  /**
   * Las salidas del vacío: el botón que lo llena y, si hay otro camino, el
   * segundo. Se reciben como contenido porque unas veces son enlaces y otras
   * abren un formulario que sólo conoce la página.
   */
  children?: ReactNode
}

/**
 * Un vacío que ENSEÑA, en vez de una frase gris en mitad de la pantalla.
 *
 * ERA UNA LÍNEA —«Aún no has creado ninguna rutina»— centrada en un hueco de
 * 400 px. Decía lo que ya se veía y no decía nada de lo que hace falta saber:
 * qué es una rutina, para qué sirve, y por dónde se empieza. La primera
 * pantalla de alguien que acaba de crear su equipo son TRES de estos vacíos
 * seguidos, así que son la primera explicación que recibe.
 *
 * ALINEADO A LA IZQUIERDA y no centrado: se lee como el resto de la aplicación,
 * y el botón cae donde cae el pulgar y no en mitad de la nada.
 *
 * NO SE MEZCLA CON «no hay resultados». Un filtro sin coincidencias sigue
 * siendo una frase: lo que hace falta ahí es quitar el filtro, no dar de alta a
 * alguien que ya existe.
 */
export function EmptyState({ icon: Icon, title, body, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-3.5 py-7">
      <span className="flex size-14 items-center justify-center rounded-full bg-cobalt-tint text-cobalt">
        <Icon aria-hidden="true" className="size-6" strokeWidth={1.75} />
      </span>

      <h2 className="font-display text-[1.625rem] font-extrabold uppercase leading-none tracking-tight text-ink">
        {title}
      </h2>

      <p className="max-w-[20rem] text-[15px] leading-relaxed text-ink/60">{body}</p>

      {children !== undefined && (
        <div className="flex w-full flex-col items-stretch gap-2 pt-1.5 sm:max-w-xs">
          {children}
        </div>
      )}
    </div>
  )
}
