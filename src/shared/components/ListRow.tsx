import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface ListRowProps {
  /** A dónde lleva la fila entera. */
  to: string
  /** La línea que se busca al escanear: un nombre, un título. */
  primary: string
  /** Lo que ayuda a distinguir uno de otro. Una línea, y se trunca. */
  secondary?: string
  /** Avatar, inicial o icono a la izquierda. */
  leading?: ReactNode
  /**
   * Estado a la derecha, antes de la flecha: una insignia. Queda DEBAJO del
   * enlace estirado, así que no puede ser un control: tocarlo abre la ficha.
   */
  trailing?: ReactNode
  className?: string
}

/**
 * Una fila de lista, de las que se escanean.
 *
 * FILA Y NO TARJETA, y el criterio es para qué sirve la lista. Una lista para
 * ENCONTRAR a alguien se recorre de arriba abajo buscando un nombre: cuanto más
 * corta es cada entrada, menos hay que desplazar y antes se encuentra. La
 * tarjeta se reserva para donde el objeto ES el contenido —una rutina con sus
 * ejercicios—, no para donde es una entrada de índice.
 *
 * La medida sale de contarlo: el padrón de alumnos daba 320 px por ficha y en
 * un teléfono cabía una y media; en filas de 64 caben los cuatro de la semilla
 * y sobra sitio. Lo que la tarjeta enseñaba no se pierde, está a un toque.
 *
 * TODA LA FILA ES EL ENLACE, con el enlace estirado sobre ella —`after:inset-0`,
 * el mismo patrón que la tarjeta de rutina y la ficha del plan—. Así el
 * objetivo táctil es la fila de 64 px y no las letras del nombre, y el nombre
 * accesible del enlace sigue siendo el texto principal.
 *
 * SIN MENÚ POR FILA, a propósito: una fila lleva a su ficha y nada más. Un
 * control por fila multiplica los destinos táctiles de una pantalla que se
 * recorre con el pulgar, y obliga a subirlo por encima del enlace estirado.
 */
export function ListRow({
  to,
  primary,
  secondary,
  leading,
  trailing,
  className,
}: ListRowProps) {
  return (
    <li
      className={cn(
        'relative flex min-h-16 items-center gap-3 border-b border-cobalt-tint-3 py-2',
        className
      )}
    >
      {leading}

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Link
          to={to}
          className="truncate text-[15px] font-semibold leading-tight text-ink outline-none after:absolute after:inset-0 focus-visible:underline"
        >
          {primary}
        </Link>
        {secondary !== undefined && (
          <span className="truncate text-[13px] text-ink/60">{secondary}</span>
        )}
      </span>

      {trailing}

      <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-ink/35" />
    </li>
  )
}
