import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface ListRowProps {
  /**
   * A dónde lleva la fila entera. Sin destino, la fila no es un enlace ni
   * lleva flecha, y lo de `trailing` puede ser un control: es la fila de un
   * pendiente que se resuelve ahí mismo, como copiar una invitación.
   */
  to?: string
  /**
   * Sustituye la entrada del historial en vez de añadir una. Para las filas que
   * cambian de sección dentro de la misma pantalla: volver tiene que salir de
   * ella, no recorrer sus secciones.
   */
  replace?: boolean
  /**
   * Qué hace la fila entera cuando lo que abre NO es una dirección: la ficha de
   * una sesión, que es un diálogo. Se ignora si hay `to`.
   */
  onSelect?: () => void
  /**
   * Nombre accesible de la fila, cuando sus dos líneas no bastan para decidir.
   * La agenda lo usa para decir además el estado y la duración.
   */
  label?: string
  /** La línea que se busca al escanear: un nombre, un título. */
  primary: string
  /** Lo que ayuda a distinguir uno de otro. Una línea, y se trunca. */
  secondary?: string
  /** Avatar, inicial o icono a la izquierda. */
  leading?: ReactNode
  /**
   * Estado a la derecha, antes de la flecha: una insignia. Con destino queda
   * DEBAJO del enlace estirado, así que no puede ser un control: tocarlo
   * abre el destino.
   */
  trailing?: ReactNode
  className?: string
}

interface RowTextProps {
  primary: string
  secondary?: string
}

/** Las dos líneas de la fila. El subrayado marca el foco del teclado. */
function RowText({ primary, secondary }: RowTextProps) {
  return (
    <>
      <span className="truncate text-[15px] font-semibold leading-tight text-ink group-focus-visible:underline">
        {primary}
      </span>
      {secondary !== undefined && (
        <span className="truncate text-[13px] text-ink/60">{secondary}</span>
      )}
    </>
  )
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
 * objetivo táctil es la fila de 64 px y no las letras del nombre.
 *
 * Y EL ENLACE ENVUELVE LAS DOS LÍNEAS, con 44 px de alto propios. Envolvía
 * sólo el nombre y su caja medía 19 px: el área de pulsación era la de la fila,
 * pero la auditoría de 375 px —y cualquier otra— lo contaba como un destino de
 * 19 px. De paso, el nombre accesible es la fila entera, nombre y apoyo, que es
 * lo que un lector de pantalla debe decir al pasar por ella.
 *
 * SIN MENÚ POR FILA, a propósito: una fila con destino lleva a él y nada más. Un
 * control por fila multiplica los destinos táctiles de una pantalla que se
 * recorre con el pulgar, y obliga a subirlo por encima del enlace estirado.
 */
export function ListRow({
  to,
  replace = false,
  onSelect,
  label,
  primary,
  secondary,
  leading,
  trailing,
  className,
}: ListRowProps) {
  // El mismo estirado en las tres formas: el objetivo táctil es la fila.
  const stretched =
    'group flex min-h-11 min-w-0 flex-1 flex-col justify-center gap-0.5 text-left outline-none after:absolute after:inset-0'
  return (
    <li
      className={cn(
        'relative flex min-h-16 items-center gap-3 border-b border-cobalt-tint-3 py-2',
        className
      )}
    >
      {leading}

      {to !== undefined ? (
        <Link to={to} replace={replace} aria-label={label} className={stretched}>
          <RowText primary={primary} secondary={secondary} />
        </Link>
      ) : onSelect !== undefined ? (
        <button type="button" onClick={onSelect} aria-label={label} className={stretched}>
          <RowText primary={primary} secondary={secondary} />
        </button>
      ) : (
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <RowText primary={primary} secondary={secondary} />
        </span>
      )}

      {trailing}

      {to !== undefined && (
        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-ink/35" />
      )}
    </li>
  )
}
