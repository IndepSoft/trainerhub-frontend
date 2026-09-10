import type { StudentBadge } from '@/shared/domain/entities/progress'
import type { Achievement, BadgeDefinition } from '../types/achievement.types'

/**
 * Las veinte insignias, como se presentan.
 *
 * Aquí no hay condiciones: la regla de cada código vive en `evaluate_badges`,
 * en la base, y en su espejo simulado. Lo que este catálogo afirma es cómo se
 * llama cada una, con qué icono se graba y en qué escalón de rareza cae.
 *
 * SEIS RAREZAS, de bronce a mítico. Platino y Diamante exigen que el
 * entrenador las confirme: son las que dan valor comercial al perfil, y una
 * racha de cien días que nadie ha visto no debería colgarse sola.
 *
 * Mítico no tiene ninguna todavía: son las de evento y temporada, y eso
 * depende de que existan eventos.
 */
export const badgeCatalog: BadgeDefinition[] = [
  { code: 'first-session', nameKey: 'badge.firstSession.name', descriptionKey: 'badge.firstSession.description', icon: 'star', category: 'performance', rarity: 'bronze', requiresValidation: false },
  { code: 'first-weight', nameKey: 'badge.firstWeight.name', descriptionKey: 'badge.firstWeight.description', icon: 'dumbbell', category: 'technique', rarity: 'bronze', requiresValidation: false },
  { code: 'iron-foundation', nameKey: 'badge.ironFoundation.name', descriptionKey: 'badge.ironFoundation.description', icon: 'shield', category: 'streak', rarity: 'bronze', requiresValidation: false },
  { code: 'cardio-hour', nameKey: 'badge.cardioHour.name', descriptionKey: 'badge.cardioHour.description', icon: 'heart', category: 'performance', rarity: 'bronze', requiresValidation: false },
  { code: 'perfect-week', nameKey: 'achievement.perfectWeek.name', descriptionKey: 'achievement.perfectWeek.description', icon: 'trophy', category: 'streak', rarity: 'bronze', requiresValidation: false },
  { code: 'never-miss-monday', nameKey: 'achievement.neverMissMonday.name', descriptionKey: 'achievement.neverMissMonday.description', icon: 'calendar', category: 'streak', rarity: 'bronze', requiresValidation: false },
  { code: 'early-bird', nameKey: 'achievement.earlyBird.name', descriptionKey: 'achievement.earlyBird.description', icon: 'sunrise', category: 'streak', rarity: 'silver', requiresValidation: false },
  { code: 'monthly-warrior', nameKey: 'achievement.monthlyWarrior.name', descriptionKey: 'achievement.monthlyWarrior.description', icon: 'medal', category: 'streak', rarity: 'silver', requiresValidation: false },
  { code: 'habit-former', nameKey: 'achievement.habitFormer.name', descriptionKey: 'achievement.habitFormer.description', icon: 'flame', category: 'streak', rarity: 'silver', requiresValidation: false },
  { code: 'hundred-sets', nameKey: 'badge.hundredSets.name', descriptionKey: 'badge.hundredSets.description', icon: 'dumbbell', category: 'performance', rarity: 'silver', requiresValidation: false },
  { code: 'ten-hours', nameKey: 'badge.tenHours.name', descriptionKey: 'badge.tenHours.description', icon: 'timer', category: 'longevity', rarity: 'silver', requiresValidation: false },
  { code: 'overload-architect', nameKey: 'badge.overloadArchitect.name', descriptionKey: 'badge.overloadArchitect.description', icon: 'target', category: 'technique', rarity: 'silver', requiresValidation: false },
  { code: 'comeback', nameKey: 'badge.comeback.name', descriptionKey: 'badge.comeback.description', icon: 'award', category: 'longevity', rarity: 'silver', requiresValidation: false },
  { code: 'iron-will', nameKey: 'achievement.ironWill.name', descriptionKey: 'achievement.ironWill.description', icon: 'target', category: 'streak', rarity: 'gold', requiresValidation: false },
  { code: 'eight-weeks', nameKey: 'badge.eightWeeks.name', descriptionKey: 'badge.eightWeeks.description', icon: 'shield', category: 'longevity', rarity: 'gold', requiresValidation: false },
  { code: 'thousand-sets', nameKey: 'badge.thousandSets.name', descriptionKey: 'badge.thousandSets.description', icon: 'dumbbell', category: 'performance', rarity: 'gold', requiresValidation: false },
  { code: 'full-plan', nameKey: 'badge.fullPlan.name', descriptionKey: 'badge.fullPlan.description', icon: 'medal', category: 'technique', rarity: 'gold', requiresValidation: false },
  { code: 'unstoppable', nameKey: 'achievement.unstoppable.name', descriptionKey: 'achievement.unstoppable.description', icon: 'flame', category: 'streak', rarity: 'gold', requiresValidation: false },
  { code: 'coach-seal', nameKey: 'badge.coachSeal.name', descriptionKey: 'badge.coachSeal.description', icon: 'shield', category: 'technique', rarity: 'platinum', requiresValidation: false },
  { code: 'legend', nameKey: 'achievement.legend.name', descriptionKey: 'achievement.legend.description', icon: 'flame', category: 'streak', rarity: 'platinum', requiresValidation: true },
  { code: 'persistence', nameKey: 'badge.persistence.name', descriptionKey: 'badge.persistence.description', icon: 'trophy', category: 'longevity', rarity: 'diamond', requiresValidation: true },
]

/** `YYYY-MM-DD` a fecha local, sin pasar por UTC: a medianoche cambiaría de día. */
function dateOf(dayKey: string): Date {
  const [year, month, day] = dayKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Los códigos, para compararlos con los del servidor. */
export const BADGE_CODES: string[] = badgeCatalog.map((definition) => definition.code)

/**
 * El catálogo entero, cruzado con lo conseguido.
 *
 * Devuelve las veinte SIEMPRE, conseguidas o no: la galería enseña lo que
 * queda por conseguir, que es lo que motiva. Un código del servidor que el
 * catálogo no conozca se ignora aquí y lo denuncia la prueba de contrato.
 */
export function achievementsFrom(unlocked: StudentBadge[]): Achievement[] {
  const byCode = new Map(unlocked.map((badge) => [badge.code, badge]))
  return badgeCatalog.map((definition) => {
    const badge = byCode.get(definition.code)
    return {
      ...definition,
      unlockedAt: badge === undefined ? undefined : dateOf(badge.unlockedOn),
      pendingValidation:
        badge !== undefined && definition.requiresValidation && badge.validatedAt === null,
    }
  })
}
