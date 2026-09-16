import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { ListRow } from '@/shared/components/ListRow'
import { SubscriptionBadge } from '@/shared/components/SubscriptionBadge'
import { getInitials, getShortName } from '@/shared/lib/personName'
import type { StudentProgress } from '../hooks/useStudentsProgress'
import type { SubscriptionStanding } from '@/shared/domain/entities/studentSubscription'
import type { Student } from '@/shared/domain/entities/student'
import {
  useTranslation,
  type Pluralize,
  type Translate,
} from '@/shared/i18n/LanguageContext'
import { STUDENT_LEVEL_LABEL_KEY } from '@/shared/i18n/domainLabels'

interface StudentRowProps {
  student: Student
  /**
   * Cuánto ha entrenado. `undefined` mientras carga, `null` si nada.
   *
   * Llega por props y no se pide aquí: con veinte filas serían veinte
   * consultas. La página lo trae de una vez con `useStudentsProgress`.
   */
  progress: StudentProgress | null | undefined
  /** En qué punto está su cuota. La página la trae para toda la lista. */
  standing: SubscriptionStanding
}

/**
 * Un alumno en el padrón: una fila para encontrarle.
 *
 * SUSTITUYE A LA TARJETA. La tarjeta enseñaba edad, grasa, nivel, objetivos y
 * la franja de progreso —todo lo de su ficha, en pequeño— y ocupaba 320 px, así
 * que en un teléfono cabía una y media y encontrar a alguien era desplazar.
 * Aquí va lo que sirve para DISTINGUIR a uno de otro, y lo demás está a un
 * toque.
 *
 * LA LÍNEA DE APOYO SE COMPONE POR IMPORTANCIA, no por completitud: nivel,
 * cuánto lleva entrenado, y la cuota sólo cuando reclama algo. Una línea que lo
 * dice todo no dice nada, porque se deja de leer.
 */
export function StudentRow({ student, progress, standing }: StudentRowProps) {
  const { t, plural } = useTranslation()
  const fullName = getShortName(student.firstName, student.lastName)

  return (
    <ListRow
      to={`/students/${student.id}`}
      primary={fullName}
      secondary={describeStudent(student, progress, standing, t, plural)}
      leading={
        <Avatar className="size-10 shrink-0">
          <AvatarImage src={student.photoUrl} alt="" />
          <AvatarFallback className="bg-cobalt-tint-2 text-xs font-bold text-cobalt">
            {getInitials(student.firstName, student.lastName)}
          </AvatarFallback>
        </Avatar>
      }
      trailing={trailingBadge(student, standing, t)}
    />
  )
}

/**
 * El estado que se pinta a la derecha, y sólo uno.
 *
 * MANDA EL DINERO. Una cuota vencida es lo único de esta lista que cuesta algo
 * cada día que pasa; «sin cuenta» es un trámite que puede esperar. Con los dos
 * a la vez, la fila tendría dos insignias compitiendo y ninguna destacaría.
 */
function trailingBadge(
  student: Student,
  standing: SubscriptionStanding,
  t: Translate
): React.ReactNode {
  if (standing.state === 'overdue' || standing.state === 'dueSoon') {
    return <SubscriptionBadge standing={standing} brief />
  }

  if (student.profileId === null) {
    return (
      <span className="shrink-0 rounded-action border border-cobalt-tint-3 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/55">
        {t('crew.noAccount')}
      </span>
    )
  }

  return null
}

/**
 * «Intermedio · 10 sesiones · cuota vencida».
 *
 * La cuota vencida sale AQUÍ Y TAMBIÉN en la insignia, y la repetición es
 * deliberada: la insignia es la versión que se ve de un vistazo y no se puede
 * truncar, y la línea es la que se lee. En una pantalla estrecha la línea se
 * corta por el final y la insignia sigue ahí.
 */
function describeStudent(
  student: Student,
  progress: StudentProgress | null | undefined,
  standing: SubscriptionStanding,
  t: Translate,
  plural: Pluralize
): string {
  const parts: string[] = [t(STUDENT_LEVEL_LABEL_KEY[student.level])]

  // `undefined` es «todavía no se sabe» y se calla: escribir «sin sesiones»
  // mientras carga afirma algo falso sobre quien sí ha entrenado.
  if (progress !== undefined) {
    const completedSessions = progress?.completedSessions ?? 0
    parts.push(
      completedSessions === 0
        ? t('studentRow.noSessions')
        : plural(
            'studentProgress.sessionCount.one',
            'studentProgress.sessionCount.other',
            completedSessions,
            { count: completedSessions }
          )
    )
  }

  if (standing.state === 'overdue') parts.push(t('studentRow.overdue'))

  return parts.join(' · ')
}
