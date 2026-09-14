import type { ReactNode } from 'react'

interface AuthScreenProps {
  /** El bloque de imagen, o nada en las pantallas que no lo llevan. */
  hero?: ReactNode
  children: ReactNode
}

/**
 * Una pantalla de acceso: la imagen y el formulario.
 *
 * DOS COMPOSICIONES, NO UNA ESTIRADA. En móvil —que es el caso base del
 * proyecto— la imagen va arriba y el formulario debajo, en una sola columna.
 * Desde `lg` se parten en dos mitades: la imagen ocupa la altura entera de la
 * suya y el formulario se centra en la otra.
 *
 * La versión anterior tenía UNA sola composición, la de móvil, metida en una
 * columna de 448 px centrada. En una ventana de 1440 px eso dejaba dos tercios
 * de pantalla en blanco y una imagen de 420 px de alto encima de cuatro campos:
 * la forma de un teléfono, dibujada en grande. Una pantalla de escritorio no es
 * una de móvil con más margen a los lados.
 *
 * El corte va en `lg` y no antes porque a 768 px las dos mitades salen a 384 px,
 * por debajo del ancho mínimo útil que exige §1.6 de `CLAUDE.md`. Hasta ahí, la
 * composición de móvil es la que funciona.
 *
 * QUIÉN DESPLAZA CAMBIA CON LA COMPOSICIÓN, y es la razón de que el contenedor
 * de la página viva aquí y no en cada ruta. En móvil desplaza la página entera,
 * porque la imagen tiene que poder salir de la vista para que quepa el
 * formulario. En escritorio la imagen se queda quieta y desplaza SÓLO la
 * columna del formulario, que es la única que puede crecer —el alta de
 * entrenador en una ventana baja—.
 */
export function AuthScreen({ hero, children }: AuthScreenProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-bone lg:overflow-hidden">
      <div className="flex flex-1 flex-col lg:grid lg:min-h-0 lg:grid-cols-2">
        {hero}

        <div className="flex flex-1 flex-col lg:min-h-0 lg:justify-center lg:overflow-y-auto lg:px-12 lg:py-12">
          {/*
            El ancho de lectura del formulario es el mismo en las dos
            composiciones. Lo que cambia es que en escritorio deja de estirarse
            hasta el fondo: el `flex-1` existe para que los botones puedan bajar
            con `mt-auto` a donde llega el pulgar, y en una ventana de
            escritorio no hay pulgar al que acercárselos.
          */}
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-6 pb-6 pt-7 lg:flex-none lg:px-0 lg:pb-0 lg:pt-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
