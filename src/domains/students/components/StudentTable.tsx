import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { SubscriptionBadge } from '@/shared/components/SubscriptionBadge'
import { getInitials, getShortName } from '@/shared/lib/personName'
import { cn } from '@/shared/lib/utils'
import { LEVEL_BADGE } from '../libs/levelBadge'
import type { StudentProgress } from '../hooks/useStudentsProgress'
import type { SubscriptionStanding } from '@/shared/domain/entities/studentSubscription'
import type { Student } from '@/shared/domain/entities/student'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { STUDENT_LEVEL_LABEL_KEY } from '@/shared/i18n/domainLabels'

interface StudentTableProps {
  students: Student[]
  /** Cuánto ha entrenado cada uno. `undefined` mientras carga. */
  progressById: Map<string, StudentProgress | null>
  loadingProgress: boolean
  standingOf: (studentId: string) => SubscriptionStanding
}

/** Las columnas, en el orden en que se leen. La última es la flecha, sin rótulo. */
const COLUMN_LABEL_KEYS = [
  'studentTable.student',
  'studentTable.level',
  'studentTable.sessions',
  'studentTable.dues',
  'studentTable.account',
] as const

const CELL = 'px-3 py-2 align-middle'

/**
 * El padrón en una TABLA, que es lo que la lista de filas quiere ser en ancho.
 *
 * La fila de móvil dice nivel, sesiones y cuota en UNA línea truncada porque
 * a 390 px no cabe otra cosa. A 1024 sí cabe: cada dato en su columna, alineado
 * con el de arriba, que es lo que permite recorrer la columna «Cuota» de un
 * vistazo en vez de leer cuatro líneas enteras. Es el caso que la regla 1.6
 * llama «una pantalla de móvil estirada»: sin esto, la lista era una fila de
 * 900 px con el nombre a la izquierda y el resto en blanco.
 *
 * MISMO DESTINO Y MISMO OBJETIVO TÁCTIL que `ListRow`: el enlace se estira
 * sobre la fila entera —`after:inset-0` sobre una `<tr>` relativa—, así que se
 * pulsa cualquier parte de ella y el nombre accesible es el del alumno.
 *
 * No sustituye a `ListRow`: la elige la página según el ancho, y por eso ésta
 * no se monta nunca en un teléfono. Ver `useWideViewport`.
 */
export function StudentTable({
  students,
  progressById,
  loadingProgress,
  standingOf,
}: StudentTableProps) {
  const { t } = useTranslation()

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-cobalt-tint-3">
          {COLUMN_LABEL_KEYS.map((key) => (
            <th
              key={key}
              scope="col"
              className="px-3 pb-2 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/60"
            >
              {t(key)}
            </th>
          ))}
          <th scope="col" className="w-10">
            <span className="sr-only">{t('studentTable.open')}</span>
          </th>
        </tr>
      </thead>

      <tbody>
        {students.map((student) => {
          const standing = standingOf(student.id)
          const progress = loadingProgress ? undefined : (progressById.get(student.id) ?? null)
          const fullName = getShortName(student.firstName, student.lastName)

          return (
            <tr
              key={student.id}
              className="relative border-b border-cobalt-tint-3 transition-colors hover:bg-cobalt-tint-1 focus-within:bg-cobalt-tint-1"
            >
              <td className={CELL}>
                <span className="flex min-h-11 items-center gap-3">
                  <Avatar className="size-9 shrink-0">
                    <AvatarImage src={student.photoUrl} alt="" />
                    <AvatarFallback className="bg-cobalt-tint-2 text-xs font-bold text-cobalt">
                      {getInitials(student.firstName, student.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex min-w-0 flex-col">
                    {/* El enlace estirado: el objetivo es la fila entera, como
                        en `ListRow`, y no las letras del nombre. */}
                    <Link
                      to={`/students/${student.id}`}
                      className="truncate text-[15px] font-semibold leading-tight text-ink outline-none after:absolute after:inset-0 focus-visible:underline"
                    >
                      {fullName}
                    </Link>
                    <span className="truncate text-[13px] text-ink/60">{student.email}</span>
                  </span>
                </span>
              </td>

              <td className={CELL}>
                <span
                  className={cn(
                    'inline-flex items-center rounded-action border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]',
                    LEVEL_BADGE[student.level]
                  )}
                >
                  {t(STUDENT_LEVEL_LABEL_KEY[student.level])}
                </span>
              </td>

              {/* La cifra en Condensed, como en la franja de métricas: una
                  columna de números se compara de arriba abajo. */}
              <td className={cn(CELL, 'font-display text-xl font-extrabold leading-none')}>
                {progress === undefined ? (
                  <span className="text-[13px] font-medium text-ink/45">—</span>
                ) : (
                  (progress?.completedSessions ?? 0)
                )}
              </td>

              <td className={CELL}>
                <SubscriptionBadge standing={standing} />
              </td>

              <td className={CELL}>
                {student.profileId === null ? (
                  <span className="inline-flex items-center rounded-action border border-cobalt-tint-3 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/60">
                    {t('crew.noAccount')}
                  </span>
                ) : (
                  <span className="text-[13px] text-ink/60">{t('studentTable.hasAccount')}</span>
                )}
              </td>

              <td className={cn(CELL, 'text-right')}>
                <ChevronRight aria-hidden="true" className="size-5 text-ink/35" />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
