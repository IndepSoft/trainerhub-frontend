import { InputWithIcon } from '@/shared/components/InputWithIcon'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Search } from 'lucide-react'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { STUDENT_LEVEL_LABEL_KEY } from '@/shared/i18n/domainLabels'
import type { TrainingLevel } from '@/shared/domain/entities/routine'
import type { RoutineFilterState } from '../libs/filterRoutines'

const LEVELS: TrainingLevel[] = ['Principiante', 'Intermedio', 'Avanzado']

interface TrainingFiltersProps {
  filters: RoutineFilterState
  onChange: (filters: RoutineFilterState) => void
}

/**
 * Barra de búsqueda y filtros de rutinas. Sólo presentación: el estado vive en
 * la lista que la pinta y el filtrado en `filterRoutines`.
 *
 * Como en alumnos, el único filtro es el nivel y va como desplegable a la
 * vista, no detrás de un botón «Filtros».
 */
export function TrainingFilters({ filters, onChange }: TrainingFiltersProps) {
  const { t } = useTranslation()

  return (
    // Buscador y filtro en UNA fila tambien en movil. Apilados se llevaban
    // 100 px antes de la primera tarjeta; el filtro es corto y cabe al lado.
    <div className="flex items-center gap-2 sm:justify-between sm:gap-3">
      <div className="min-w-0 flex-1 sm:max-w-sm">
        <InputWithIcon
          icon={<Search className="w-4 h-4" />}
          iconPosition="left"
          placeholder={t('trainings.searchRoutines')}
          aria-label={t('trainings.searchRoutines')}
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
        />
      </div>
      <Select
        value={filters.level}
        onValueChange={(level) => {
          if (level === 'all' || isTrainingLevel(level)) onChange({ ...filters, level })
        }}
      >
        <SelectTrigger className="w-auto shrink-0 sm:w-48" aria-label={t('trainings.filters')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filters.level.all')}</SelectItem>
          {LEVELS.map((level) => (
            <SelectItem key={level} value={level}>
              {t(STUDENT_LEVEL_LABEL_KEY[level])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function isTrainingLevel(value: string): value is TrainingLevel {
  return LEVELS.some((level) => level === value)
}
