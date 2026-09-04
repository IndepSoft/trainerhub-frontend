import { cn } from '@/shared/lib/utils'
import type { LoadPoint } from '@/shared/domain/loadProgression'

interface LoadSparklineProps {
  /** De la más antigua a la más reciente. Con menos de dos no se pinta nada. */
  points: LoadPoint[]
  /** Lo que dice la gráfica, para quien no la ve. */
  label: string
}

/**
 * Margen vertical, en porcentaje de la altura.
 *
 * Sin él, el punto más alto y el más bajo caen justo en el borde y se cortan a
 * la mitad. Con margen, la línea ocupa el 80 % central y los extremos se ven
 * enteros.
 */
const VERTICAL_INSET = 12

/**
 * Lo mismo a los lados, también en porcentaje.
 *
 * Medido en el navegador: sin él, el primer punto y el último caen con su centro
 * justo en el borde y la mitad de cada uno queda fuera del marco. Son los dos que
 * más se miran —de dónde se venía y dónde se está hoy—, así que son justo los que
 * no pueden salir cortados.
 */
const HORIZONTAL_INSET = 4

/**
 * La progresión de un ejercicio, dibujada.
 *
 * SIN LIBRERÍA DE GRÁFICOS. Una línea con seis puntos es una lista de
 * coordenadas y un `polyline`; traer una librería para esto sería repetir
 * exactamente lo que se quitó de Reportes, con su peso en el paquete y su API
 * que aprender. Cuando haga falta un eje de tiempo real, leyendas o zoom, será
 * otra conversación.
 *
 * DIBUJA EL PESO MEDIDO, NO EL 1RM ESTIMADO. La gráfica es lo que más se mira y
 * lo que menos se cuestiona, así que enseña hechos: la serie más pesada de cada
 * día. La estimación va al lado, en cifra y con su nombre, donde se puede leer
 * que es una estimación.
 *
 * EL EJE HORIZONTAL SON SESIONES, NO FECHAS. Repartir por fecha real dejaría
 * cuatro sesiones seguidas amontonadas a la izquierda tras un parón de dos
 * meses, y la pregunta que se le hace a esto —«¿voy subiendo?»— se responde
 * sesión a sesión. La fecha de cada punto está en la lista de debajo.
 *
 * LOS PUNTOS SON HTML SOBRE EL SVG, no círculos dentro. El trazo se estira a lo
 * ancho del contenedor con `preserveAspectRatio="none"`, que es lo que le
 * permite ocupar cualquier ancho sin calcular medidas, pero esa misma deformación
 * convertiría un círculo en un óvalo. Colocados por porcentaje quedan redondos
 * en cualquier ancho.
 */
export function LoadSparkline({ points, label }: LoadSparklineProps) {
  // Con un solo punto no hay línea que trazar, y un punto suelto en un recuadro
  // vacío ocupa sitio sin decir nada que no diga ya la cifra de al lado.
  if (points.length < 2) return null

  const weights = points.map((point) => point.topWeightKg)
  const lowest = Math.min(...weights)
  const highest = Math.max(...weights)
  const span = highest - lowest

  const horizontalOf = (index: number) =>
    HORIZONTAL_INSET + (index / (points.length - 1)) * (100 - HORIZONTAL_INSET * 2)

  /*
   * De abajo arriba, y con el rango COMPRIMIDO AL PROPIO HISTORIAL en vez de
   * arrancar en cero.
   *
   * Es la decisión discutible de una gráfica de cargas, así que va dicha: desde
   * cero, una progresión de 60 a 75 kg sería una línea casi plana y no se vería
   * nada. Aquí la pregunta no es «cuánto levanta» —esa la contesta la cifra— sino
   * «¿sube?», y para eso el eje tiene que ocuparse de los quince kilos que
   * cambian. A cambio, la pendiente NO es comparable entre dos ejercicios.
   *
   * Sin variación, la línea va por el centro: repartirla por el borde superior o
   * el inferior insinuaría una tendencia que no existe.
   */
  const verticalOf = (weight: number) => {
    if (span === 0) return 50
    const share = (weight - lowest) / span
    return 100 - VERTICAL_INSET - share * (100 - VERTICAL_INSET * 2)
  }

  const polyline = points
    .map((point, index) => `${horizontalOf(index)},${verticalOf(point.topWeightKg)}`)
    .join(' ')

  return (
    <div role="img" aria-label={label} className="relative mt-2 h-14 w-full">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="size-full overflow-visible text-cobalt"
      >
        <polyline
          points={polyline}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          /* El trazo NO se estira con el dibujo: sin esto, la misma línea sale
             fina en una pantalla ancha y gorda en una estrecha. */
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {points.map((point, index) => {
        const isLatest = index === points.length - 1

        return (
          <span
            key={point.date}
            aria-hidden="true"
            className={cn(
              'absolute -translate-x-1/2 -translate-y-1/2 rounded-full',
              // El último, más grande y relleno: es la carga de hoy, que es la
              // que se busca al mirar.
              isLatest ? 'size-2.5 bg-cobalt ring-2 ring-bone' : 'size-1.5 bg-cobalt/50'
            )}
            style={{
              left: `${horizontalOf(index)}%`,
              top: `${verticalOf(point.topWeightKg)}%`,
            }}
          />
        )
      })}
    </div>
  )
}
