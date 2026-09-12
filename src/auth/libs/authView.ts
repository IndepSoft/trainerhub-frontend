/**
 * Qué se enseña en `/authentication`: identificarse o darse de alta.
 *
 * VIAJA EN LA DIRECCIÓN y no en estado del componente. Antes eran dos pestañas
 * dentro de una tarjeta, y cambiar de una a otra no dejaba rastro: un enlace
 * «regístrate» desde fuera no podía abrir el alta, y el botón de atrás del
 * navegador salía de la página entera en vez de volver al acceso. Con el
 * parámetro, las dos pantallas son direcciones que se pueden enlazar y a las
 * que se puede volver.
 */
export type AuthView = 'login' | 'register'

export const AUTH_VIEW_PARAM = 'vista'

const REGISTER_VALUE = 'registro'

export function readAuthView(search: URLSearchParams): AuthView {
  return search.get(AUTH_VIEW_PARAM) === REGISTER_VALUE ? 'register' : 'login'
}

/** La búsqueda de la dirección que abre cada pantalla. */
export function authViewSearch(view: AuthView): string {
  return view === 'register' ? `?${AUTH_VIEW_PARAM}=${REGISTER_VALUE}` : ''
}
