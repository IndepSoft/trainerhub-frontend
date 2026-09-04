import { useMemo, useState } from 'react'
import { AchievementBadge } from './AchievementBadge'
import { cn } from '@/shared/lib/utils'
import { unlockedAchievements } from '../libs/achievementEvaluation'
import type { Achievement, AchievementCategory } from '../types/achievement.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'
import { activeLocale } from '@/shared/i18n/activeLocale'

interface AchievementSystemProps {
  /**
   * Los logros del alumno, YA EVALUADOS.
   *
   * Se reciben en vez de leerlos aquí. Antes el componente importaba el
   * catálogo simulado directamente y declaraba un `studentId` que no usaba: la
   * galería enseñaba los mismos seis logros conseguidos para cualquiera. Quien
   * los evalúa es `useGamificationProfile`, que es el único que sabe de qué
   * alumno se trata.
   */
  achievements: Achievement[]
}

type CategoryFilter = 'all' | Achievement['category']
type RarityFilter = 'all' | Achievement['rarity']

const CATEGORY_LABEL_KEY: Record<AchievementCategory, TranslationKey> = {
  attendance: 'achievement.category.attendance',
  consistency: 'achievement.category.consistency',
  metrics: 'achievement.category.metrics',
  challenges: 'achievement.category.challenges',
}

const RARITY_LABEL_KEY: Record<RarityFilter, TranslationKey> = {
  all: 'achievement.rarity.all',
  common: 'achievement.rarity.common',
  rare: 'achievement.rarity.rare',
  epic: 'achievement.rarity.epic',
  legendary: 'achievement.rarity.legendary',
}



export function AchievementSystem({ achievements }: AchievementSystemProps) {
  const { t } = useTranslation()
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [rarity, setRarity] = useState<RarityFilter>('all')

  const unlocked = useMemo(() => unlockedAchievements(achievements), [achievements])

  /**
   * Cuántos hay conseguidos por categoría.
   *
   * Un solo recorrido en vez de cuatro `filter` separados, que era como estaba:
   * el mismo array recorrido cuatro veces para contar cuatro cosas.
   */
  const countByCategory = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const achievement of unlocked) {
      counts[achievement.category] = (counts[achievement.category] ?? 0) + 1
    }
    return counts
  }, [unlocked])

  /*
   * Las categorias salen del catalogo, no de una lista escrita al lado.
   *
   * Estaban las cuatro fijas, y al quitar del catalogo los logros de «metricas»
   * y «desafios» -no hay de donde sacarlos- quedaron dos fichas que abrian una
   * galeria vacia. Derivandolas, un filtro sin nada detras no puede existir.
   */
  const categoryFilters = useMemo<CategoryFilter[]>(() => {
    const present = new Set(achievements.map((achievement) => achievement.category))
    return ['all', ...[...present].sort((first, second) => first.localeCompare(second))]
  }, [achievements])

  const filtered = achievements.filter((achievement) => {
    const matchesCategory = category === 'all' || achievement.category === category
    const matchesRarity = rarity === 'all' || achievement.rarity === rarity
    return matchesCategory && matchesRarity
  })

  // `unlockedAchievements` ya los devuelve del mas reciente al mas antiguo, y
  // sobre una copia: no hay que reordenar ni cuidar de no mutar.
  const recent = unlocked.slice(0, 3)

  return (
    <div className="space-y-8">
      <p className="text-sm text-ink/50">
        <span className="metric-figures font-display text-2xl font-extrabold text-ink">
          {unlocked.length}
        </span>
        <span className="metric-figures text-ink/40"> / {achievements.length}</span>
        {' logros conseguidos · '}
        <span className="metric-figures font-semibold text-cobalt">
          {achievements.length === 0 ? 0 : Math.round((unlocked.length / achievements.length) * 100)}%
        </span>
      </p>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4 border-b border-cobalt-tint-3 pb-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
            {t('achievement.gallery')}
          </h3>

          <label className="flex items-center gap-2 text-xs text-ink/50">
            <span className="sr-only">{t('achievement.filterByRarity')}</span>
            <select
              value={rarity}
              onChange={(event) => setRarity(event.target.value as RarityFilter)}
              className="h-11 rounded-none border-b border-cobalt-tint-3 bg-transparent pe-6 text-xs font-semibold uppercase tracking-wider text-ink/70"
            >
              {Object.entries(RARITY_LABEL_KEY).map(([value, key]) => (
                <option key={value} value={value}>
                  {t(key)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/*
          Filtro de categoria como fichas, NO como pestanas.
          Antes eran un `TabsList` anidado dentro de las pestanas de la pagina:
          dos niveles de navegacion en la misma pantalla, cuando en realidad esto
          nunca fue navegacion. Filtrar y navegar son cosas distintas y deben
          verse distintas.
        */}
        <div
          role="group"
          aria-label={t('achievement.filterByCategory')}
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
        >
          {categoryFilters.map((value) => {
            const isActive = category === value
            const count = value === 'all' ? unlocked.length : (countByCategory[value] ?? 0)
            return (
              <button
                key={value}
                type="button"
                aria-pressed={isActive}
                onClick={() => setCategory(value)}
                className={cn(
                  'flex h-11 shrink-0 items-center gap-1.5 rounded-action border px-4 text-xs font-semibold uppercase tracking-wider transition-colors',
                  isActive
                    ? 'border-cobalt bg-cobalt text-white'
                    : 'border-cobalt-tint-3 text-ink/60 hover:border-cobalt/40'
                )}
              >
                {value === 'all'
                  ? t('achievement.category.all')
                  : t(CATEGORY_LABEL_KEY[value])}
                <span className="metric-figures opacity-60">{count}</span>
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
          {filtered.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              unlocked={Boolean(achievement.unlockedAt)}
              size="medium"
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-ink/40">
            {t('achievement.noneMatch')}
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="border-b border-cobalt-tint-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
          {t('achievement.recent')}
        </h3>

        {recent.length === 0 && (
          <p className="py-6 text-sm text-ink/40">
            {t('achievement.noneYet')}
          </p>
        )}

        <ul className="space-y-5">
          {recent.map((achievement) => (
            <li key={achievement.id} className="flex items-center gap-4">
              <AchievementBadge achievement={achievement} unlocked size="small" />

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{t(achievement.nameKey)}</p>
                <p className="text-sm text-ink/50">{t(achievement.descriptionKey)}</p>
                <p className="metric-figures mt-1 text-[11px] uppercase tracking-wider text-ink/35">
                  {achievement.unlockedAt?.toLocaleDateString(activeLocale())}
                </p>
              </div>

              <span className="metric-figures shrink-0 font-display text-sm font-bold text-cobalt">
                +{achievement.pointsReward} XP
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
