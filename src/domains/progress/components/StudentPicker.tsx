import { getShortName } from '@/shared/lib/personName'
import type { Student } from '@/shared/domain/entities/student'

interface StudentPickerProps {
  students: Student[]
  selectedId?: string
  onSelect: (studentId: string) => void
}

/**
 * De qué alumno se está viendo el progreso.
 *
 * Un `<select>` nativo y no el de shadcn: es un cambio de contexto, no un campo
 * de formulario, y en móvil el selector del sistema es más rápido de usar que
 * una lista flotante. Es la misma decisión que ya tomó el filtro de rareza de la
 * galería de logros, que está a media pantalla de aquí.
 *
 * `h-11` porque es un objetivo táctil y la regla §1.6 pide 44 px.
 */
export function StudentPicker({ students, selectedId, onSelect }: StudentPickerProps) {
  if (students.length === 0) return null

  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">Ver el progreso de</span>
      <select
        value={selectedId ?? ''}
        onChange={(event) => onSelect(event.target.value)}
        className="h-11 max-w-[14rem] rounded-none border-b border-cobalt-tint-3 bg-transparent pe-6 text-xs font-semibold uppercase tracking-wider text-ink/70"
      >
        {students.map((student) => (
          <option key={student.id} value={student.id}>
            {getShortName(student.firstName, student.lastName)}
          </option>
        ))}
      </select>
    </label>
  )
}
