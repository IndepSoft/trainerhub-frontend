import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

interface MetricStripProps {
  children: ReactNode
  /** Columnas desde `sm`. En móvil son siempre dos. */
  columns: 3 | 4
  className?: string
}

const COLUMNS_CLASS: Record<MetricStripProps['columns'], string> = {
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

/**
 * Franja de métricas separadas por reglas de 1 px, no por bordes de tarjeta.
 *
 * DOS COLUMNAS EN MÓVIL, no una. Apiladas, tres métricas se llevaban 330 px
 * —cuatro, 440— antes de que la página enseñara nada, y son cifras de un
 * solo golpe de vista: caben de dos en dos a 175 px por celda, que es la
 * misma `<dl>` de dos columnas que ya usan las tarjetas de alumno y de
 * rutina. Es la excepción medida a «toda rejilla arranca en una columna»:
 * cada celda es una etiqueta corta y un número, no un bloque de texto.
 *
 * Es una `<dl>` de verdad, no un `div` con aspecto de lista: cada celda es
 * un término —la etiqueta— con su definición —la cifra—, que es lo que
 * `MetricBlock` pinta con `dt` y `dd`. Y es lo que la prueba de las reglas
 * de 375 px usa para no contarlas como contenedores estrechos.
 *
 * Las reglas las dibuja el `gap-px` sobre un fondo del color de la línea:
 * cada celda tapa el fondo con el suyo y la rendija que queda entre ellas
 * ES la regla. Sale bien con cualquier número de celdas y con celdas que
 * abarcan dos columnas, que es donde `divide-x` se rompía.
 */
export function MetricStrip({ children, columns, className }: MetricStripProps) {
  return (
    <dl
      className={cn(
        'grid grid-cols-2 gap-px border-y border-cobalt-tint-3 bg-cobalt-tint-3',
        COLUMNS_CLASS[columns],
        className
      )}
    >
      {children}
    </dl>
  )
}
