import { useCallback, useEffect, useState } from 'react'
import { cacheKey, readCachedValue, writeCachedValue } from '@/shared/lib/queryCache'
import { describeError } from '@/shared/i18n/errorMessages'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'

interface UseCachedQueryOptions<T> {
  /**
   * Qué lectura es y qué la delimita: `['students', crewId]`.
   *
   * El ámbito va DENTRO de la clave, no fuera. Con `['students']` a secas, al
   * cambiar de equipo se pintarían un instante los alumnos del anterior; con el
   * equipo en la clave, la lectura del otro equipo sencillamente no existe
   * todavía y se muestra su carga.
   */
  key: readonly (string | number | null | undefined)[]
  /** La lectura. Cambiar su identidad no relanza nada: manda `key`. */
  load: () => Promise<T>
  /**
   * Suscripción a cambios del puerto. Devuelve cómo darse de baja.
   *
   * Es lo que mantiene honesta a la caché: dar de alta a un alumno refresca la
   * lista, aquí y en cualquier otra pantalla que la esté leyendo.
   */
  subscribe?: (reload: () => void) => () => void
  /** Qué enseñar la primera vez, antes de que haya respuesta. */
  initial: T
  /** Qué decir si la lectura falla. */
  errorKey: TranslationKey
}

interface UseCachedQueryResult<T> {
  data: T
  /**
   * Si NO hay nada que enseñar todavía.
   *
   * Con algo en la caché es `false` desde el primer renderizado aunque la
   * revalidación siga en marcha: el dato de hace un minuto es infinitamente
   * mejor que un hueco, y es lo que evita el parpadeo al cambiar de módulo.
   */
  loading: boolean
  error: string | null
  /** Vuelve a leer. Lo usa el gesto de tirar para actualizar. */
  refresh: () => void
}

/**
 * Una lectura que RECUERDA lo último que respondió.
 *
 * EL PROBLEMA QUE RESUELVE, medido: cada módulo montaba sus hooks desde cero
 * —`loading` en cierto, listas vacías— y volvía a preguntar al puerto. Con
 * datos simulados no se nota; contra la base, desde un teléfono, cada vuelta a
 * un módulo eran varios viajes de ida y vuelta con la pantalla vacía mientras
 * tanto. Cambiar de pestaña se sentía como recargar la aplicación.
 *
 * LO QUE HACE es lo que hace una aplicación nativa con sus pestañas: enseña lo
 * que ya tenía y comprueba por detrás si cambió. La primera visita a un módulo
 * sigue teniendo su espera —no hay nada que enseñar—; la segunda y las
 * siguientes, ninguna.
 *
 * NO ES UNA CACHÉ DE RED ni pretende serlo: no caduca por tiempo ni guarda en
 * disco. Vive mientras vive la pestaña, y la verdad sigue siendo lo que el
 * puerto responda. La suscripción es lo que la mantiene al día.
 */
export function useCachedQuery<T>({
  key,
  load,
  subscribe,
  initial,
  errorKey,
}: UseCachedQueryOptions<T>): UseCachedQueryResult<T> {
  const { t } = useTranslation()
  const entryKey = cacheKey(key)

  /*
   * El estado arranca de la caché, no vacío. `useState` con función para que
   * la lectura ocurra una vez por montaje y no en cada renderizado.
   */
  const [data, setData] = useState<T>(() => cachedOr(entryKey, initial))
  const [loading, setLoading] = useState(() => readCachedValue(entryKey) === undefined)
  const [error, setError] = useState<string | null>(null)
  /** Sube de uno en uno para pedir otra lectura sin duplicar el efecto. */
  const [reloadCount, setReloadCount] = useState(0)

  const refresh = useCallback(() => setReloadCount((previous) => previous + 1), [])

  /*
   * La clave manda: al cambiar —otro equipo, otro alumno— lo de antes deja de
   * valer. Se adopta lo que haya en la caché para la clave nueva, y si no hay
   * nada se vuelve a la espera.
   */
  useEffect(() => {
    const cached = readCachedValue(entryKey)
    setData(cachedOr(entryKey, initial))
    setLoading(cached === undefined)
    setError(null)
    // `initial` se omite a propósito: es un valor por defecto, normalmente un
    // literal nuevo en cada renderizado, y depender de él relanzaría esto sin
    // parar. Lo que decide es la clave.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryKey])

  useEffect(() => {
    // Bandera de cancelación: sin ella, una respuesta vieja puede pisar a una
    // nueva, y escribir estado tras desmontar avisa por consola.
    let active = true

    const run = () => {
      load()
        .then((result) => {
          writeCachedValue(entryKey, result)
          if (!active) return
          setData(result)
          setError(null)
        })
        .catch((cause: unknown) => {
          if (active) setError(describeError(cause, t, errorKey))
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }

    run()
    const unsubscribe = subscribe?.(run)

    return () => {
      active = false
      unsubscribe?.()
    }
    // `load` y `subscribe` se omiten: son funciones nuevas en cada renderizado
    // y ponerlas aquí relanzaría la lectura en bucle. Lo que las identifica es
    // la clave, que sí está.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryKey, reloadCount, t])

  return { data, loading, error, refresh }
}

/**
 * Lo guardado para esa clave, estrechado, o el valor inicial.
 *
 * El estrechamiento vive AQUÍ y en ningún otro sitio: la caché guarda
 * `unknown` porque no puede conocer los tipos de cada dominio, y quien la lee
 * sí sabe qué pidió. Concentrarlo en una función deja un único punto donde esa
 * afirmación se hace, en vez de repartirla por cada hook.
 */
function cachedOr<T>(key: string, initial: T): T {
  const cached = readCachedValue(key)
  if (cached === undefined) return initial

  // La caché es privada de este módulo y sólo la escribe la lectura de esta
  // misma clave, así que lo guardado es del tipo que esa lectura devuelve.
  return cached as T
}
