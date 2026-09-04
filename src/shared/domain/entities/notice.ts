/**
 * Un aviso privado del entrenador a un alumno.
 *
 * NO ES EL MURO, y la diferencia importa. El muro es un tablón: lo lee el equipo
 * entero. Un recordatorio de cuota es entre dos personas, y publicarlo donde lo
 * ven sus compañeros sería exponer a alguien por deber dinero.
 *
 * MANDARLO TIENE QUE PODER LEERSE. Un aviso que no llega a ninguna parte no es
 * un aviso: por eso esto existe con su bandeja en la campana, en vez de que el
 * botón de «avisar» lance una notificación al vacío.
 *
 * TODO: es un aviso DENTRO de la aplicación. Correo, WhatsApp o notificación
 * push son otro trabajo —y otro consentimiento—; hasta entonces, quien no abra
 * la aplicación no se entera.
 */
export interface Notice {
  id: string
  crewId: string
  /** A quién va dirigido, por su ficha de alumno. */
  studentId: string
  /**
   * Por qué se manda.
   *
   * Se guarda el motivo y no sólo el texto para poder agrupar y contar después
   * —«cuántos recordatorios de cuota van este mes»— sin adivinarlo leyendo
   * frases. Hoy sólo cambia el icono.
   */
  kind: NoticeKind
  body: string
  /** Instante en ISO. Un aviso ocurre en un momento, no «un día». */
  createdAt: string
  /** Cuándo lo leyó, o `null`. Es lo que enciende el contador de la campana. */
  readAt: string | null
}

export type NoticeKind = 'dues' | 'general'

/** Lo máximo que cabe en un aviso. */
export const NOTICE_MAX_LENGTH = 300
