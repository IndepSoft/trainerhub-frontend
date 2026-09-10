import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import { getShortName } from '@/shared/lib/personName'
import { describeError } from '@/shared/i18n/errorMessages'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { useInactiveStudents } from '../hooks/useInactiveStudents'
import { useStudentEditor } from '../hooks/useStudentEditor'

/**
 * Las bajas, plegadas bajo el padrón. Cerradas por defecto: quien ya no viene
 * no tiene que estar a la vista cada día, pero tiene que poder volver, y
 * hasta ahora no existía ni la baja ni la vuelta.
 */
export function InactiveStudents() {
  const { t } = useTranslation()
  const { inactive, loading } = useInactiveStudents()
  const { reactivateStudent } = useStudentEditor()
  const [open, setOpen] = useState(false)

  if (loading || inactive.length === 0) return null

  const handleReactivate = async (studentId: string, name: string) => {
    try {
      await reactivateStudent(studentId)
    } catch (caught) {
      toast.error(describeError(caught, t, 'students.membershipError'))
      return
    }
    toast.success(t('students.reactivated', { name }))
  }

  return (
    <section className="pt-4">
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen((current) => !current)}>
        {open ? t('students.hideInactive') : t('students.showInactive', { count: inactive.length })}
      </Button>

      {open && (
        <div className="mt-2">
          <h2 className="border-b border-cobalt-tint-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
            {t('students.inactiveHeading', { count: inactive.length })}
          </h2>
          <ul className="divide-y divide-cobalt-tint-3">
            {inactive.map((student) => {
              const name = getShortName(student.firstName, student.lastName)
              return (
                <li key={student.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/students/${student.id}`}
                      className="flex min-h-11 items-center truncate font-semibold text-ink hover:text-cobalt"
                    >
                      {name}
                    </Link>
                    <p className="truncate text-xs text-ink/45">{student.email}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => void handleReactivate(student.id, student.firstName)}
                  >
                    <RotateCcw className="size-3.5" />
                    {t('students.reactivate')}
                  </Button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
