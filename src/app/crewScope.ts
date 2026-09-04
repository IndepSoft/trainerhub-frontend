import type { CrewScope } from '@/shared/domain/ports/CrewScope'

const LAST_CREW_STORAGE_KEY = 'trainerhub.crew.activo'

let activeCrewId: string | null = readLastCrew()

/**
 * La ficha con la que se mira. No se recuerda entre recargas a propósito: sale
 * de resolver quién ha entrado, y guardarla sería una forma de que quedara
 * apuntando a una ficha que ya no es suya.
 */
let activeStudentId: string | null = null

/**
 * El crew activo, en su forma de sólo lectura.
 *
 * Es lo que reciben los adaptadores. Se separa de `setActiveCrew` a propósito:
 * quien lee el ámbito no debe poder cambiarlo. Un adaptador que pudiera moverse
 * de crew a mitad de una consulta sería exactamente el fallo de aislamiento que
 * esto existe para evitar.
 */
export const crewScope: CrewScope = {
  current: () => activeCrewId,
  asStudent: () => activeStudentId,
}

/**
 * Cambia el crew activo.
 *
 * Lo llama la capa de aplicación cuando se resuelve quién ha entrado o cuando
 * alguien cambia de crew en la barra lateral. Se recuerda entre recargas porque
 * un entrenador con un solo crew no debería tener que elegirlo cada mañana; el
 * valor recordado **se valida** contra los crews del usuario antes de usarse, en
 * `useViewer`, porque un identificador guardado en el navegador es una pista, no
 * una autorización.
 */
export function setActiveCrew(crewId: string | null, studentId: string | null = null): void {
  activeCrewId = crewId
  // Van juntos porque se responden a la vez: cambiar de crew cambia con qué
  // ficha se mira, y dejarlos desparejados enseñaría las sesiones de una ficha
  // de otro equipo.
  activeStudentId = studentId

  try {
    if (crewId === null) window.localStorage.removeItem(LAST_CREW_STORAGE_KEY)
    else window.localStorage.setItem(LAST_CREW_STORAGE_KEY, crewId)
  } catch {
    // Modo privado o almacenamiento deshabilitado: el crew simplemente no se
    // recuerda entre recargas. No es motivo para interrumpir nada.
  }
}

function readLastCrew(): string | null {
  try {
    return window.localStorage.getItem(LAST_CREW_STORAGE_KEY)
  } catch {
    return null
  }
}
