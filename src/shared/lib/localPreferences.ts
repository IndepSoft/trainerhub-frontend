/**
 * Preferencias locales del dispositivo.
 *
 * Envuelve `localStorage` en vez de usarlo suelto por dos motivos concretos, no
 * por gusto de envolver:
 *
 *  1. En navegacion privada de Safari y con las cookies de terceros bloqueadas,
 *     `localStorage` LANZA al escribir en vez de fallar en silencio. Sin
 *     try/catch, marcar el onboarding como visto tumbaria la aplicacion.
 *  2. Es la frontera de infraestructura de este dato: cuando exista backend y
 *     el «onboarding visto» viva en el perfil del entrenador, se sustituye esta
 *     implementacion y nadie mas se entera.
 *
 * Guarda solo preferencias del dispositivo. NADA de datos personales ni de
 * sesion: `localStorage` sobrevive al cierre de sesion y queda al alcance de
 * quien use luego el mismo navegador.
 */

export function readFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === 'true'
  } catch {
    // Sin almacenamiento, la respuesta segura es «no visto»: es preferible
    // repetir el onboarding que ocultarlo a quien no lo ha visto.
    return false
  }
}

export function writeFlag(key: string, value: boolean): void {
  try {
    window.localStorage.setItem(key, String(value))
  } catch {
    // Se ignora a proposito: no poder recordar la preferencia no debe impedir
    // que el usuario siga usando la aplicacion.
  }
}
