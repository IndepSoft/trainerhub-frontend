import { useMemo, useState } from 'react'
import { AchievementBadge } from './AchievementBadge'
import { predefinedAchievements } from '../data/predefinedAchievements'
import { cn } from '@/shared/lib/utils'
import type { Achievement } from '../types/achievement.types'

// TODO: `studentId` no se usa; los logros salen de predefinedAchievements
// (simulados), sin filtrar por estudiante.
interface AchievementSystemProps {
  studentId?: string
}

type CategoryFilter = 'all' | Achievement['category']
type RarityFilter = 'all' | Achievement['rarity']

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: 'Todos',
  attendance: 'Asistencia',
  consistency: 'Constancia',
  metrics: 'Métricas',
  challenges: 'Desafíos',
}

const RARITY_LABELS: Record<RarityFilter, string> = {
  all: 'Cualquier rareza',
  common: 'Común',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Legendario',
}

const CATEGORY_ORDER: CategoryFilter[] = [
  'all',
  'attendance',
  'consistency',
  'metrics',
  'challenges',
]

export function AchievementSystem(_props: AchievementSystemProps) {
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [rarity, setRarity] = useState<RarityFilter>('all')

  const unlocked = useMemo(
    () => predefinedAchievements.filter((achievement) => achievement.unlockedAt),
    []
  )

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

  const filtered = predefinedAchievements.filter((achievement) => {
    const matchesCategory = category === 'all' || achievement.category === category
    const matchesRarity = rarity === 'all' || achievement.rarity === rarity
    return matchesCategory && matchesRarity
  })

  const recent = useMemo(
    () =>
      // Copia antes de ordenar: `sort` muta, y `unlocked` se usa tambien para
      // el contador de arriba. Ordenar en sitio durante el renderizado es un
      // efecto secundario escondido.
      [...unlocked]
        .sort((a, b) => b.unlockedAt!.getTime() - a.unlockedAt!.getTime())
        .slice(0, 3),
    [unlocked]
  )

  return (
    <div className="space-y-8">
      <p className="text-sm text-ink/50">
        <span className="metric-figures font-display text-2xl font-extrabold text-ink">
          {unlocked.length}
        </span>
        <span className="metric-figures text-ink/40"> / {predefinedAchievements.length}</span>
        {' logros conseguidos · '}
        <span className="metric-figures font-semibold text-cobalt">
          {Math.round((unlocked.length / predefinedAchievements.length) * 100)}%
        </span>
      </p>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4 border-b border-cobalt-tint-3 pb-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
            Galería
          </h3>

          <label className="flex items-center gap-2 text-xs text-ink/50">
            <span className="sr-only">Filtrar por rareza</span>
            <select
              value={rarity}
              onChange={(event) => setRarity(event.target.value as RarityFilter)}
              className="h-11 rounded-none border-b border-cobalt-tint-3 bg-transparent pe-6 text-xs font-semibold uppercase tracking-wider text-ink/70"
            >
              {Object.entries(RARITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
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
          aria-label="Filtrar por categoría"
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
        >
          {CATEGORY_ORDER.map((value) => {
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
                {CATEGORY_LABELS[value]}
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
            Ningún logro coincide con este filtro.
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="border-b border-cobalt-tint-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
          Conseguidos recientemente
        </h3>

        <ul className="space-y-5">
          {recent.map((achievement) => (
            <li key={achievement.id} className="flex items-center gap-4">
              <AchievementBadge achievement={achievement} unlocked size="small" />

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{achievement.name}</p>
                <p className="text-sm text-ink/50">{achievement.description}</p>
                <p className="metric-figures mt-1 text-[11px] uppercase tracking-wider text-ink/35">
                  {achievement.unlockedAt?.toLocaleDateString('es')}
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
