/**
 * Trae los fragmentos de los módulos antes de que hagan falta.
 *
 * CADA PANTALLA ES UN FRAGMENTO APARTE —`lazy(() => import(...))`— y eso es
 * deliberado: el arranque no carga la aplicación entera. El precio es que la
 * PRIMERA visita a cada módulo espera a su descarga, y en un teléfono eso son
 * los milisegundos en blanco que se notan al tocar una pestaña.
 *
 * Aquí se pagan por adelantado, cuando el hilo está libre y la primera
 * pantalla ya está pintada. A partir de entonces cambiar de pestaña no pide
 * nada a la red.
 *
 * SÓLO LOS DESTINOS DE LA BARRA, no todo: las fichas, los formularios y el
 * catálogo se abren desde dentro y su espera va acompañada de un gesto
 * deliberado. Traerlo todo convertiría el ahorro del arranque en un gasto
 * diferido de la misma cantidad.
 */
const MODULE_LOADERS: (() => Promise<unknown>)[] = [
  () => import('@/domains/dashboard/pages/Dashboard'),
  () => import('@/domains/students/pages/Students'),
  () => import('@/domains/trainings/pages/Trainings'),
  () => import('@/domains/calendar/pages/Calendar'),
  () => import('@/domains/crew/pages/CrewPage'),
  () => import('@/domains/progress/pages/Progress'),
]

let alreadyPrefetched = false

/**
 * `requestIdleCallback` donde exista, y un plazo corto donde no.
 *
 * Safari no lo implementa —ni en iOS, que es la mitad del objetivo de una PWA
 * instalada—, así que sin este respaldo la mejora no existiría justo donde más
 * se nota.
 */
function whenIdle(task: () => void): void {
  /*
   * Se pregunta por la FUNCIÓN y no con `in`: el tipo del DOM la declara como
   * si siempre estuviera, así que `'requestIdleCallback' in window` deja a
   * TypeScript creyendo que la otra rama es imposible. En Safari sí lo es.
   */
  const requestIdle: typeof window.requestIdleCallback | undefined =
    window.requestIdleCallback

  if (typeof requestIdle === 'function') {
    requestIdle(task, { timeout: 3000 })
    return
  }

  window.setTimeout(task, 1200)
}

/**
 * Pide los fragmentos de los módulos, uno detrás de otro.
 *
 * EN SERIE Y NO EN PARALELO: son seis peticiones que no corren prisa, y
 * lanzarlas a la vez competiría por el ancho de banda con lo que la pantalla
 * abierta sí está esperando. Un fallo no se reintenta ni se dice: si la red se
 * cae, el módulo se pedirá igual cuando se abra, y entonces sí habrá alguien
 * mirando a quien contárselo.
 */
export function prefetchModules(): void {
  if (alreadyPrefetched) return
  alreadyPrefetched = true

  whenIdle(() => {
    void MODULE_LOADERS.reduce(
      (queue, loadModule) => queue.then(() => loadModule()).catch(() => undefined),
      Promise.resolve<unknown>(undefined)
    )
  })
}
