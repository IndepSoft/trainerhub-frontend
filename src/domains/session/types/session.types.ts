/**
 * Entidades de la sesión en vivo.
 *
 * Se declaran aquí y no dentro de los componentes por el mismo motivo que en
 * `dashboard.types`: el dato debe sobrevivir a cualquier cambio de presentación,
 * y un segundo componente debe poder reutilizarlo sin arrastrar los props del
 * primero.
 */

export type LiveSessionState = 'running' | 'paused' | 'finished'
