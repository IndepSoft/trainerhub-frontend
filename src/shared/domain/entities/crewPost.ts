/**
 * Un anuncio del entrenador en el muro de su equipo.
 *
 * PUBLICA SÓLO QUIEN ENTRENA, y eso lo convierte en un canal de anuncios en vez
 * de en una red social. La diferencia importa: sin publicaciones de los alumnos
 * no hay moderación que construir, ni denuncias, ni bloqueos, ni el trabajo
 * permanente que eso arrastra. Los alumnos participan dando «me gusta», que es
 * suficiente para saber si algo se ha leído.
 */
export interface CrewPost {
  id: string
  crewId: string
  /** Quién lo escribió. Su nombre se resuelve, no se copia. */
  authorProfileId: string
  body: string
  /**
   * Cuándo se publicó, como INSTANTE en ISO (`2026-09-01T18:30:00.000Z`).
   *
   * Aquí sí se usa `toISOString`, al revés que en las fechas de la agenda, y no
   * es una excepción a la regla sino la otra mitad de la misma: lo que rompía
   * era derivar un DÍA DEL CALENDARIO de un instante en UTC —una sesión de las
   * 20:00 del 15 se convertía en el día 16 en husos negativos—. Un anuncio no
   * ocurre «el día 15», ocurre en un momento, y el momento no tiene huso: se
   * guarda absoluto y se pinta en la hora de quien mira.
   */
  createdAt: string
  /**
   * Los perfiles a los que les gusta.
   *
   * COMO LISTA Y NO COMO CONTADOR porque hacen falta las dos cosas: cuántos son,
   * y si estoy yo —sin lo segundo el botón no puede saber si ya lo pulsé—. Un
   * contador suelto obligaría a una segunda consulta para averiguarlo.
   *
   * TODO: no escala. Con un backend real esto es una tabla aparte y lo que viaja
   * al cliente son dos campos calculados —cuántos, y si el que mira está—, no la
   * lista entera de gente. Con equipos de decenas de personas da igual; con
   * miles, no.
   */
  likedBy: string[]
}

/** Lo máximo que cabe en un anuncio. */
export const CREW_POST_MAX_LENGTH = 500
