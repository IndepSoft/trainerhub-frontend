import { useCrewActivity } from '../hooks/useCrewActivity'

/**
 * Cuándo se entrena, por franja horaria. Sólo composición.
 *
 * LA PREGUNTA DE NEGOCIO ES SI CABE MÁS GENTE. Un entrenador con la tarde llena
 * y la mañana vacía no necesita más alumnos: necesita moverlos de hora. Eso no
 * se ve en un total mensual, que es lo que la pantalla enseñaba antes.
 *
 * Barras y no una gráfica: son seis o siete franjas con un número cada una, y
 * una librería de gráficos para eso añade peso al paquete sin decir nada que la
 * barra no diga. La escala es relativa a la franja más cargada, que es la
 * comparación que importa.
 */
export function ActivityBreakdown() {
  const { byHour, loading } = useCrewActivity()

  if (loading) return null

  if (byHour.length === 0) {
    return (
      <p className="py-8 text-sm text-ink/45">
        Todavía no hay sesiones completadas. La ocupación se calcula a partir de
        ellas.
      </p>
    )
  }

  const busiest = byHour[0].completed

  return (
    <ul className="space-y-2">
      {byHour.map((slot) => (
        <li key={slot.hour} className="flex items-center gap-3">
          <span className="metric-figures w-14 shrink-0 text-sm font-semibold text-ink/60">
            {slot.hour}
          </span>

          <span className="h-6 flex-1 rounded-block bg-cobalt-tint-2">
            <span
              className="block h-full rounded-block bg-cobalt"
              // El ancho depende del dato, así que va en `style`: una clase de
              // Tailwind con un porcentaje calculado no existe en el CSS
              // generado, porque el compilador no ve ese valor.
              style={{ width: `${Math.round((slot.completed / busiest) * 100)}%` }}
            />
          </span>

          <span className="metric-figures w-8 shrink-0 text-end text-sm text-ink/45">
            {slot.completed}
          </span>
        </li>
      ))}
    </ul>
  )
}
