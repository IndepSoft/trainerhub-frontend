import type { ReactNode } from 'react'

interface AuthScreenProps {
  /** El bloque de imagen, o nada en las pantallas que no lo llevan. */
  hero?: ReactNode
  children: ReactNode
}

/**
 * Una pantalla de acceso: la imagen arriba y el formulario debajo, sin tarjeta.
 *
 * A LO ANCHO DE LA PANTALLA EN MÓVIL Y EN UNA COLUMNA EN ESCRITORIO. La
 * propuesta se compuso para el teléfono, que es el caso base de la aplicación;
 * en una ventana grande, una foto de 1400 px con un titular de 52 px sería un
 * cartel, no una pantalla de acceso. La columna conserva la composición.
 *
 * El formulario crece hasta el fondo (`flex-1`) para que las acciones puedan
 * bajar con `mt-auto` a donde llega el pulgar, y la página entera desplaza
 * cuando no cabe: la raíz de la ruta es `overflow-y-auto`, que es justo lo que
 * le faltaba a la pantalla anterior.
 */
export function AuthScreen({ hero, children }: AuthScreenProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      {hero}
      <div className="flex flex-1 flex-col gap-5 px-6 pb-6 pt-7">{children}</div>
    </div>
  )
}
