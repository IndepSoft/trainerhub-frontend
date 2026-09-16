import { InputWithIcon } from '@/shared/components/InputWithIcon'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/shared/ui/select'
import { Search } from 'lucide-react'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { STUDENT_LEVEL_LABEL_KEY } from '@/shared/i18n/domainLabels'
import type { StudentLevel } from '@/shared/domain/entities/student'
import type { StudentFilterState } from '../libs/filterStudents'

const LEVELS: StudentLevel[] = ['Principiante', 'Intermedio', 'Avanzado']

interface StudentFiltersProps {
  filters: StudentFilterState
  onChange: (filters: StudentFilterState) => void
}

/**
 * Barra de búsqueda y filtros del listado. Sólo presentación: el estado vive
 * en la página y el filtrado en `filterStudents`.
 *
 * El botón «Filtros» se sustituye por el único filtro que existe, el nivel.
 * Un botón que abre un panel para elegir una sola cosa es un paso de más, y
 * mientras no haya más criterios el desplegable dice exactamente lo que hay.
 */
export function StudentFilters({ filters, onChange }: StudentFiltersProps) {
  const { t } = useTranslation()
  const selectedLevel =
    filters.level === 'all' ? null : t(STUDENT_LEVEL_LABEL_KEY[filters.level])

  return (
    // Buscador y filtro en UNA fila tambien en movil. Apilados se llevaban
    // 100 px antes de la primera fila; el filtro es corto y cabe al lado.
    <div className="flex items-center gap-2 sm:justify-between sm:gap-3">
      <div className="min-w-0 flex-1 sm:max-w-sm">
        <InputWithIcon
          icon={<Search className="w-4 h-4" />}
          iconPosition="left"
          placeholder={t('students.search')}
          aria-label={t('students.search')}
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
        />
      </div>
      <Select
        value={filters.level}
        onValueChange={(level) => {
          if (level === 'all' || isStudentLevel(level)) onChange({ ...filters, level })
        }}
      >
        {/*
          EL DISPARADOR DICE «NIVEL», no «Todos los niveles». Con `SelectValue`
          el boton medía lo que midiera la opcion elegida, asi que el filtro sin
          usar se llevaba media fila del buscador. Apagado no necesita nombrar
          su valor, sino QUE filtra; puesto, enseña el nivel, que es corto.

          El `aria-label` no es opcional: `combobox` no toma el nombre de su
          contenido. Y CONTIENE siempre el texto visible —«Nivel», o «Nivel:
          Intermedio»—, porque quien dicta por voz lo que ve tiene que dar con
          el control (WCAG 2.5.3).
        */}
        <SelectTrigger
          className="w-auto shrink-0"
          aria-label={
            selectedLevel === null
              ? t('filters.level.label')
              : t('filters.level.selected', { level: selectedLevel })
          }
        >
          {selectedLevel ?? t('filters.level.label')}
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

function isStudentLevel(value: string): value is StudentLevel {
  return LEVELS.some((level) => level === value)
}
