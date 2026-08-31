import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, TrendingUp } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/components/PageHeader'
import { PageSkeleton } from '@/shared/components/PageSkeleton'
import { getInitials, getShortName } from '@/shared/lib/personName'
import { useStudent } from '../hooks/useStudent'
import { StudentAssignments } from '../components/StudentAssignments'
import { StudentSessions } from '../components/StudentSessions'
import { ScheduleSessionDialog } from '../components/ScheduleSessionDialog'
import { LEVEL_BADGE } from '../libs/levelBadge'
import { cn } from '@/shared/lib/utils'

/**
 * Ficha de un estudiante. Sólo composición.
 */
export default function StudentDetail() {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const { studentId } = useParams<{ studentId: string }>()
  const { student, loading } = useStudent(studentId)

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
          Estudiante no encontrado
        </p>
        <p className="text-sm text-ink/50">
          El enlace puede haber caducado o el estudiante ya no existe.
        </p>
        <Button asChild variant="outline">
          <Link to="/students">Volver a estudiantes</Link>
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
          Estudiantes
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
            {/* TODO: «Ver progreso» sigue sin conectar. */}
            <Button variant="outline" className="gap-2">
              <TrendingUp className="size-4" />
              Ver progreso
            </Button>
            <Button className="gap-2" onClick={() => setIsScheduleOpen(true)}>
              <Calendar className="size-4" />
              Agendar sesión
            </Button>
          </PageHeader.Actions>
        </PageHeader.Content>
      </PageHeader>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Metric label="Edad" value={`${student.age}`} unit="años" />
          <Metric label="Grasa corporal" value={`${student.bodyFatPercentage}`} unit="%" />
          <Metric label="Nivel" value={student.level} badgeClassName={LEVEL_BADGE[student.level]} />
        </div>

        <section className="px-5 py-8">
          <h2 className="mb-4 border-b border-cobalt-tint-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
            Objetivos
          </h2>
          <div className="flex flex-wrap gap-2">
            {student.goals.map((goal) => (
              <span
                key={goal}
                className="rounded-action border border-cobalt-tint-3 px-3 py-1.5 text-sm text-ink/70"
              >
                {goal}
              </span>
            ))}
          </div>
        </section>

        <StudentAssignments student={student} />

        <StudentSessions student={student} />
      </div>

      <ScheduleSessionDialog
        student={student}
        open={isScheduleOpen}
        onOpenChange={setIsScheduleOpen}
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
