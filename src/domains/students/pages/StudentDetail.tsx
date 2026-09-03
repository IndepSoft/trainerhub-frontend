import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Calendar } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/components/PageHeader'
import { PageSkeleton } from '@/shared/components/PageSkeleton'
import { getInitials, getShortName } from '@/shared/lib/personName'
import { useStudent } from '../hooks/useStudent'
import { StudentAssignments } from '../components/StudentAssignments'
import { StudentProgressSection } from '../components/StudentProgressSection'
import { StudentSubscriptionSection } from '../components/StudentSubscriptionSection'
import { StudentSessions } from '../components/StudentSessions'
import { ScheduleSessionDialog } from '../components/ScheduleSessionDialog'
import { LEVEL_BADGE } from '../libs/levelBadge'
import { cn } from '@/shared/lib/utils'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { STUDENT_LEVEL_LABEL_KEY, goalLabel } from '@/shared/i18n/domainLabels'

/**
 * Ficha de un estudiante. Sólo composición.
 */
export default function StudentDetail() {
  const { t } = useTranslation()
  const { studentId } = useParams<{ studentId: string }>()
  const { student, loading } = useStudent(studentId)

  /*
   * `?agendar` abre el dialogo al entrar. Lo usa «Agendar sesion» del menu de
   * la tarjeta, en la lista: sin esto, esa entrada del menu llevaba a la ficha
   * y dejaba al entrenador buscando el boton, que es exactamente el paso que
   * pedia evitar.
   *
   * En la URL y no en el estado del enrutador porque asi el enlace se puede
   * compartir y sobrevive a una recarga.
   */
  const [searchParams, setSearchParams] = useSearchParams()
  const [isScheduleOpen, setIsScheduleOpen] = useState(searchParams.has('agendar'))

  const handleScheduleOpenChange = (open: boolean) => {
    setIsScheduleOpen(open)
    if (open || !searchParams.has('agendar')) return

    // Se limpia al cerrar para que recargar no lo vuelva a abrir. `replace`
    // para no dejar un paso intermedio en el historial.
    const remaining = new URLSearchParams(searchParams)
    remaining.delete('agendar')
    setSearchParams(remaining, { replace: true })
  }

  /*
   * «Cargando» y «no existe» son estados distintos y hay que distinguirlos.
   * Con el hook sincrono anterior daba igual; ahora lee del puerto y en el
   * primer renderizado `student` es null porque la promesa no ha resuelto. Sin
   * esta guarda, la ficha enseñaba «Estudiante no encontrado» durante un
   * instante en CADA visita.
   */
  if (loading) {
    return <PageSkeleton />
  }

  if (!student) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-bone px-6 text-center">
        <p className="font-display text-2xl font-extrabold uppercase text-ink">
          {t('students.notFound')}
        </p>
        <p className="text-sm text-ink/50">
          {t('students.notFoundHint')}
        </p>
        <Button asChild variant="outline">
          <Link to="/students">{t('students.backToStudents')}</Link>
        </Button>
      </div>
    )
  }

  const fullName = getShortName(student.firstName, student.lastName)
  const initials = getInitials(student.firstName, student.lastName)

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      <PageHeader>
        {/* Enlace de vuelta explicito y no solo el gesto del sistema: en una PWA
            instalada no hay barra del navegador con boton de atras. */}
        <Link
          to="/students"
          className="-ms-2 mb-3 inline-flex h-11 items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/45 transition-colors hover:text-cobalt"
        >
          <ArrowLeft className="size-4" />
          {t('students.title')}
        </Link>

        <PageHeader.Content>
          <div className="flex items-center gap-4">
            <Avatar className="size-14 shrink-0">
              <AvatarImage src={student.photoUrl} alt={fullName} />
              <AvatarFallback className="bg-cobalt-tint-2 text-cobalt">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <PageHeader.Eyebrow>{student.email}</PageHeader.Eyebrow>
              <PageHeader.Title className="text-3xl">{fullName}</PageHeader.Title>
            </div>
          </div>

          <PageHeader.Actions>
            {/* «Ver progreso» ya no lleva a ninguna parte: el progreso esta en
                esta misma pagina, mas abajo. Un boton que baja la pagina no es
                un destino, es ruido. */}
            <Button className="gap-2" onClick={() => setIsScheduleOpen(true)}>
              <Calendar className="size-4" />
              {t('studentCard.scheduleSession')}
            </Button>
          </PageHeader.Actions>
        </PageHeader.Content>
      </PageHeader>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Metric
            label={t('studentCard.age')}
            value={`${student.age}`}
            unit={t('studentCard.years')}
          />
          <Metric label={t('studentDetail.bodyFat')} value={`${student.bodyFatPercentage}`} unit="%" />
          <Metric
            label={t('studentDetail.level')}
            value={t(STUDENT_LEVEL_LABEL_KEY[student.level])}
            badgeClassName={LEVEL_BADGE[student.level]}
          />
        </div>

        <section className="px-5 py-8">
          <h2 className="mb-4 border-b border-cobalt-tint-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
            {t('studentDetail.goals')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {student.goals.map((goal) => (
              <span
                key={goal}
                className="rounded-action border border-cobalt-tint-3 px-3 py-1.5 text-sm text-ink/70"
              >
                {goalLabel(goal, t)}
              </span>
            ))}
          </div>
        </section>

        <StudentSubscriptionSection student={student} />

        <StudentProgressSection studentId={student.id} />

        <StudentAssignments student={student} />

        <StudentSessions student={student} />
      </div>

      <ScheduleSessionDialog
        student={student}
        open={isScheduleOpen}
        onOpenChange={handleScheduleOpenChange}
      />
    </div>
  )
}

interface MetricProps {
  label: string
  value: string
  unit?: string
  badgeClassName?: string
}

/** Métrica del registro sobrio: etiqueta pequeña, cifra grande, sin caja. */
function Metric({ label, value, unit, badgeClassName }: MetricProps) {
  return (
    <div className="flex flex-col gap-2 px-5 py-6">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">
        {label}
      </span>
      {badgeClassName ? (
        <span
          className={cn(
            'w-fit rounded-action border px-2.5 py-0.5 text-sm font-semibold uppercase tracking-wider',
            badgeClassName
          )}
        >
          {value}
        </span>
      ) : (
        <p className="metric-figures font-display text-4xl font-extrabold leading-none text-ink">
          {value}
          {unit && <span className="ml-1 text-xl font-bold text-ink/45">{unit}</span>}
        </p>
      )}
    </div>
  )
}
