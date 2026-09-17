import { useSearchParams } from 'react-router-dom'

/**
 * El parámetro que dice qué sección está abierta.
 *
 * El mismo en todas las pantallas que van por secciones —la ficha del alumno,
 * el equipo, el progreso—: quien se aprende una dirección se las sabe todas.
 */
export const SECTION_PARAM = 'seccion'

interface UseUrlSectionResult<Section extends string> {
  /** La sección abierta. La primera de la lista cuando la dirección no dice otra. */
  section: Section
  select: (section: Section) => void
}

/**
 * La sección abierta, en la dirección.
 *
 * EN LA URL Y NO EN EL ESTADO porque así se puede enlazar —el «Le toca» de la
 * ficha lleva a la sección donde se resuelve cada cosa— y sobrevive a recargar.
 *
 * SIEMPRE CON `replace`: volver tiene que salir de la pantalla, no recorrer sus
 * secciones una por una. Y la primera sección no escribe nada en la dirección,
 * que es la que se ve al entrar; sólo las demás.
 *
 * `sections` es la lista de las que EXISTEN AHORA, que no siempre son todas: el
 * ranking del equipo se puede apagar, y el QR sólo lo ve quien puede invitar.
 * Una dirección que nombre una sección que no está cae en la primera, en vez de
 * dejar la pantalla en blanco.
 */
export function useUrlSection<Section extends string>(
  sections: readonly Section[],
  param: string = SECTION_PARAM
): UseUrlSectionResult<Section> {
  const [searchParams, setSearchParams] = useSearchParams()

  const requested = searchParams.get(param)
  const section = sections.find((candidate) => candidate === requested) ?? sections[0]

  const select = (next: Section) => {
    setSearchParams(
      (previous) => {
        const params = new URLSearchParams(previous)
        if (next === sections[0]) params.delete(param)
        else params.set(param, next)
        return params
      },
      { replace: true }
    )
  }

  return { section, select }
}
