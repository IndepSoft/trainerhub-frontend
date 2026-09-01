import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, CalendarRange, Dumbbell, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { useStudentAssignments } from '../hooks/useStudentAssignments'
import { useAssignableRoutines } from '../hooks/useAssignableRoutines'
import { useAssignablePlans } from '../hooks/useAssignablePlans'
import { formatDateKey } from '../libs/dateKey'
import { AssignDialog } from './AssignDialog'
import { PlanToAgendaDialog } from './PlanToAgendaDialog'
import type { Assignment, PlanAssignment } from '@/shared/domain/entities/assignment'
import type { Student } from '@/shared/domain/entities/student'

interface StudentAssignmentsProps {
  student: Student
}

/**
 * Lo que un alumno tiene asignado: planes y rutinas, juntos.
 *
 * EN UNA SOLA LISTA y no en dos secciones. No son excluyentes ni jerárquicos:
 * un alumno puede seguir un plan y tener además dos rutinas sueltas, y separarlos
 * sugeriría que hay que elegir. Lo que distingue a cada uno es su rótulo, igual
 * que en la lista de Entrenamientos.
 *
 * Ninguna de estas asignaciones ocupa un hueco en la agenda: para eso están las
 * sesiones, que se listan en la sección de al lado.
 */
export function StudentAssignments({ student }: StudentAssignmentsProps) {
  const { assignments, loading, assign, unassign } = useStudentAssignments(student.id)
  const { routines } = useAssignableRoutines()
  const { plans } = useAssignablePlans()

  const [isAssignOpen, setIsAssignOpen] = useState(false)
  /*
   * El plan que se esta volcando. Se guarda la asignacion entera y no solo su
   * identificador porque el dialogo necesita su `startDate`, que es de la
   * asignacion y no del plan: el plan dice «lunes», no «lunes 8 de septiembre».
   */
  const [dumping, setDumping] = useState<PlanAssignment | null>(null)

  const planBeingDumped = useMemo(
    () => (dumping === null ? null : (plans.find((plan) => plan.id === dumping.planId) ?? null)),
    [dumping, plans]
  )

  /*
   * Se indexan una vez para toda la lista. La asignacion guarda el
   * identificador, no el titulo: si el entrenador renombra un plan, esto lo
   * refleja sin tener que tocar ninguna asignacion.
   */
  const titlesById = useMemo(() => {
    const titles = new Map<string, string>()
    for (const routine of routines) titles.set(routine.id, routine.title)
    for (const plan of plans) titles.set(plan.id, plan.title)
    return titles
  }, [routines, plans])

  return (
    <section className="px-5 py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-cobalt-tint-3 pb-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
          Asignado
        </h2>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => setIsAssignOpen(true)}
        >
          <Plus className="size-4" />
          Asignar
        </Button>
      </div>

      {loading ? null : assignments.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink/40">
          {student.firstName} no tiene nada asignado todavía.
        </p>
      ) : (
        <ul className="divide-y divide-cobalt-tint-3">
          {assignments.map((assignment) => (
            <li key={assignment.id} className="flex items-start gap-3 py-4">
              <div className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-ink/45">
                  {assignment.kind === 'plan' ? (
                    <CalendarRange className="size-3.5" />
                  ) : (
                    <Dumbbell className="size-3.5" />
                  )}
                  {assignment.kind === 'plan' ? 'Plan' : 'Rutina'}
                </span>

                <Link
                  to={destinationOf(assignment)}
                  className="mt-1 flex min-h-11 items-center font-semibold text-ink underline-offset-4 hover:text-cobalt hover:underline"
                >
                  {titlesById.get(targetOf(assignment)) ?? 'Ya no disponible'}
                </Link>

                <p className="text-xs text-ink/45">{describeWhen(assignment)}</p>

                {assignment.notes !== '' && (
                  <p className="mt-1 text-xs text-ink/40">{assignment.notes}</p>
                )}
              </div>

              <div className="flex shrink-0 items-center">
                {/*
                  Volcar solo aparece en planes CON fecha de inicio: sin ella no
                  hay desde cuando contar las semanas, asi que el boton no
                  llevaria a ninguna parte. Una rutina suelta tampoco se vuelca:
                  es repertorio, no un programa con calendario.
                */}
                {assignment.kind === 'plan' && assignment.startDate !== null && (
                  <button
                    type="button"
                    onClick={() => setDumping(assignment)}
                    aria-label={`Volcar a la agenda ${titlesById.get(assignment.planId) ?? 'el plan'}`}
                    className="inline-flex size-11 items-center justify-center rounded-action text-ink/35 transition-colors hover:bg-cobalt-tint hover:text-cobalt"
                  >
                    <CalendarCheck className="size-4" />
                  </button>
                )}

              <button
                type="button"
                onClick={() => void unassign(assignment.id)}
                aria-label={`Quitar la asignación de ${titlesById.get(targetOf(assignment)) ?? 'este elemento'}`}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-action text-ink/35 transition-colors hover:bg-danger-surface hover:text-danger"
              >
                <Trash2 className="size-4" />
              </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AssignDialog
        student={student}
        open={isAssignOpen}
        onOpenChange={setIsAssignOpen}
        onAssign={assign}
      />

      {dumping !== null && planBeingDumped !== null && (
        <PlanToAgendaDialog
          student={student}
          plan={planBeingDumped}
          startDate={dumping.startDate ?? ''}
          open
          onOpenChange={(next) => {
            if (!next) setDumping(null)
          }}
        />
      )}
    </section>
  )
}

/** El identificador de lo asignado, sea del tipo que sea. */
function targetOf(assignment: Assignment): string {
  return assignment.kind === 'plan' ? assignment.planId : assignment.routineId
}

function destinationOf(assignment: Assignment): string {
  return assignment.kind === 'plan'
    ? `/trainings/plans/${assignment.planId}`
    : `/trainings/${assignment.routineId}`
}

/**
 * Cuándo. Un plan puede estar asignado sin empezar, y eso hay que decirlo.
 *
 * Es la diferencia entre «lo tiene» y «lo está haciendo», y sin distinguirlas la
 * lista mentiría sobre lo segundo.
 */
function describeWhen(assignment: Assignment): string {
  if (assignment.kind === 'routine') {
    return `Asignada el ${formatDateKey(assignment.assignedOn)}`
  }

  if (assignment.startDate === null) return 'Asignado, sin fecha de inicio'
  return `Empieza el ${formatDateKey(assignment.startDate)}`
}
