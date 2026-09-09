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
   * Cuántos «me gusta» tiene, y si uno de ellos es de quien mira.
   *
   * ERA LA LISTA ENTERA de perfiles, y estaba anotado que no escalaba: con
   * equipos de miles, cada anuncio viajaría con miles de identificadores. Hacen
   * falta exactamente dos cosas —cuántos, y si estoy yo— y son las dos que
   * viajan. En el servidor los «me gusta» son una tabla aparte y estos dos
   * campos se calculan al servir, para quien pregunta.
   */
  likeCount: number
  likedByMe: boolean
}

/** Lo máximo que cabe en un anuncio. */
export const CREW_POST_MAX_LENGTH = 500
