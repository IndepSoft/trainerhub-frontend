/**
 * Cálculos puros de la sesión. Sin React y sin estado: entran números, salen
 * cadenas. Se quedaron solo los relojes: distancia, ritmo y trazado se fueron
 * con la simulación de cardio, que pintaba medidas que nadie había tomado.
 */

const SECONDS_PER_HOUR = 3600

function padTwoDigits(value: number): string {
  return String(Math.floor(value)).padStart(2, '0')
}

/** `hh:mm:ss`. La hora se muestra siempre, aunque sea cero, para que la cifra no cambie de ancho a los sesenta minutos. */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR)
  const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / 60)
  const seconds = totalSeconds % 60
  return `${padTwoDigits(hours)}:${padTwoDigits(minutes)}:${padTwoDigits(seconds)}`
}

/**
 * `m:ss`, y `h:mm:ss` pasada la hora. Para relojes cortos.
 *
 * `formatDuration` no vale aqui: pinta `00:01:12` para una serie de minuto y
 * doce, y esa cifra es la protagonista de la pantalla. Dos ceros delante roban
 * el sitio al numero que importa.
 */
export function formatClock(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR)
  const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / 60)
  const seconds = totalSeconds % 60

  if (hours === 0) return `${minutes}:${padTwoDigits(seconds)}`
  return `${hours}:${padTwoDigits(minutes)}:${padTwoDigits(seconds)}`
}
