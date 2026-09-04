import type { PrescribedExercise } from '@/shared/domain/entities/routine'
import { activeLocale } from '@/shared/i18n/activeLocale'

/**
 * Cómo se escribe una rutina. Funciones puras, sin React.
 *
 * Vive en `shared/lib` y no en `shared/domain` porque es PRESENTACIÓN: son
 * etiquetas y formatos, no reglas. Mismo sitio y mismo motivo que
 * `personName.ts`, que ya guarda ahí el `getShortName` que usan tres dominios.
 *
 * Subió aquí cuando la sesión en vivo pasó a pintar los bloques de su rutina:
 * hasta entonces sólo lo hacía `trainings`, y quedarse allí habría obligado a
 * `session` a importar de otro dominio.
 */

/*
 * LA ETIQUETA DEL MÉTODO YA NO ESTÁ AQUÍ. Aquí se compone formato —cifras,
 * separadores— y eso es igual en cualquier idioma; «Superserie» no lo es, así
 * que vive en `shared/i18n/domainLabels.ts` como `BLOCK_METHOD_LABEL_KEY`.
 */

/**
 * Prescripción en una línea: «4 × 8-10 · 60 kg · RIR 2».
 *
 * Lo que no está prescrito no se escribe, en vez de rellenarlo con un cero:
 * «RIR 0» se leería como «al fallo», que es lo contrario de «no aplica», y
 * «0 kg» como una barra vacía en vez de como «elige tú la carga».
 *
 * EL PESO VA ANTES QUE EL RIR porque es lo que se decide primero: con la barra
 * delante, la carga se pone y el esfuerzo se comprueba después.
 *
 * «kg» va escrito aquí y no en los diccionarios, como «×» y como «RIR»: es el
 * símbolo de una unidad del sistema internacional y se escribe igual en los
 * tres idiomas. Traducir un símbolo invita a que alguien lo traduzca mal.
 */
export function formatPrescription(exercise: PrescribedExercise): string {
  const parts = [`${exercise.sets} × ${exercise.reps}`]

  if (exercise.weightKg !== undefined) parts.push(`${formatKilos(exercise.weightKg)} kg`)
  if (exercise.rir !== undefined) parts.push(`RIR ${exercise.rir}`)

  return parts.join(' · ')
}

/** `90` → `1:30`. Para descansos, donde el minutero se lee mejor que los segundos. */
export function formatRest(seconds: number): string {
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return remainder === 0 ? `${minutes} min` : `${minutes}:${String(remainder).padStart(2, '0')}`
}

/**
 * Los kilos como los escribe cada idioma: «62,5» en castellano, «62.5» en ingles.
 *
 * Por `Intl` y no con una coma a mano: una version anterior pintaba coma en el
 * campo del peso y punto en el resumen de la serie, asi que el mismo peso salia
 * escrito de dos formas en la misma pantalla.
 *
 * Sin decimal cuando es entero -«60», no «60,0»-, que es como se dice un peso.
 *
 * Subio aqui cuando la ficha del alumno paso a pintar la progresion de cargas:
 * hasta entonces solo lo usaba la sesion en vivo, y quedarse alli habria
 * obligado a `students` a importar de otro dominio.
 */
export function formatKilos(kilos: number): string {
  return new Intl.NumberFormat(activeLocale(), { maximumFractionDigits: 1 }).format(kilos)
}
