import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { ArrowUpRight, Calendar, MoreHorizontal, TrendingUp } from 'lucide-react'
import { getInitials, getShortName } from '@/shared/lib/personName'
import { useLongPress } from '@/shared/hooks/useLongPress'
import { cn } from '@/shared/lib/utils'
import { ConfirmDeleteDialog } from '@/shared/components/ConfirmDeleteDialog'
import { useStudentEditor } from '../hooks/useStudentEditor'
import { StudentProgressStrip } from './StudentProgressStrip'
import { LEVEL_BADGE } from '../libs/levelBadge'
import type { StudentProgress } from '../hooks/useStudentsProgress'
import type { Student } from '@/shared/domain/entities/student'

interface StudentCardProps {
  student: Student
  /**
   * Cuánto ha entrenado. `undefined` mientras carga, `null` si nada.
   *
   * Llega por props y no se pide aquí: con veinte tarjetas serían veinte
   * consultas. La página lo trae de una vez con `useStudentsProgress`.
   */
  progress: StudentProgress | null | undefined
  /** Abre el formulario de edición, que lo monta la página. */
  onEdit: (student: Student) => void
}

/**
 * Tarjeta de estudiante.
 *
 * Toma los rasgos del registro editorial —nombre en Condensed grande, el corte
 * diagonal, la rejilla de métricas, la flecha de destino— pero en tono claro y
 * con el borde del sistema. Un bloque de Ink casi negro, que fue el primer
 * intento, era trasplantar el registro agresivo entero a una aplicación que es
 * Bone de arriba abajo: no encajaba con nada de su alrededor.
 *
 * La paleta oscura queda reservada para el modo oscuro.
 *
 * El corte se hace con una cuña de Ember al 10 %: mantiene el gesto sin
 * competir con el texto, que sobre Ember sólido perdía contraste.
 */
export function StudentCard({ student, progress, onEdit }: StudentCardProps) {
  const navigate = useNavigate()
  const { deletionBlocker, deleteStudent } = useStudentEditor()
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [blockedReason, setBlockedReason] = useState<string | undefined>(undefined)
  const fullName = getShortName(student.firstName, student.lastName)
  const initials = getInitials(student.firstName, student.lastName)

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { handlers: longPressHandlers } = useLongPress({
    onLongPress: () => setIsMenuOpen(true),
  })

  return (
    <article
      className="group relative isolate flex flex-col overflow-hidden rounded-block border border-cobalt-tint-3 bg-surface transition-colors hover:border-cobalt/40 focus-within:border-cobalt"
      {...longPressHandlers}
    >
      {/* La cuña diagonal. `-z-10` con `isolate` en el contenedor: queda detrás
          del contenido de esta tarjeta sin colarse sobre las vecinas. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-[-15%] top-[15%] -z-10 h-[4.5rem] bg-ember/10 transition-transform duration-300 group-hover:-translate-y-0.5"
        style={{ clipPath: 'polygon(0 42%, 100% 0, 100% 58%, 0 100%)' }}
      />

      <div className="flex items-start justify-between gap-3 p-5 pb-0">
        <Avatar className="size-11 shrink-0">
          <AvatarImage src={student.photoUrl} alt="" />
          <AvatarFallback className="bg-cobalt-tint-2 font-display font-bold text-cobalt">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* `relative z-10` para quedar por encima del enlace estirado. Sin esto
            el enlace cubre el boton y abrir el menu es imposible.
            TODO: ninguna de las cinco acciones esta conectada. */}
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Acciones para ${fullName}`}
              className="relative z-10 -me-2 -mt-2 inline-flex size-11 shrink-0 items-center justify-center rounded-action text-ink/35 transition-colors hover:text-ink"
            >
              <MoreHorizontal className="size-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => navigate(`/students/${student.id}`)}>
              <TrendingUp className="me-2 size-4" />
              Ver ficha
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate(`/students/${student.id}?agendar`)}>
              <Calendar className="me-2 size-4" />
              Agendar sesión
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onEdit(student)}>Editar</DropdownMenuItem>
            {/*
              «Duplicar» se quita en vez de implementarse: duplicar a una
              persona no significa nada -saldrian dos fichas con el mismo
              correo, que es justo la clave con la que se enlaza su cuenta-.
              Era una entrada del menu copiada de las rutinas, donde si tiene
              sentido.

              `preventDefault` para que el menu no se cierre antes de abrir el
              dialogo: al cerrarse, Radix devuelve el foco al disparador y el
              dialogo naciente se lo encuentra ya movido.
            */}
            <DropdownMenuItem
              className="text-danger"
              onSelect={(event) => {
                event.preventDefault()
                setIsMenuOpen(false)
                void deletionBlocker(student.id).then((reason) => {
                  setBlockedReason(reason)
                  setIsDeleteOpen(true)
                })
              }}
            >
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h3 className="mt-3 px-5 font-display text-[2rem] font-extrabold uppercase leading-[0.92] tracking-tight text-ink">
        <Link
          to={`/students/${student.id}`}
          className="outline-none after:absolute after:inset-0 focus-visible:underline"
        >
          {fullName}
        </Link>
      </h3>

      <p className="mt-1.5 truncate px-5 text-xs text-ink/45">{student.email}</p>

      <dl className="mt-5 grid grid-cols-2 divide-x divide-cobalt-tint-3 border-y border-cobalt-tint-3">
        <div className="px-5 py-3">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">
            Edad
          </dt>
          <dd className="metric-figures font-display text-xl font-bold text-ink">
            {student.age}
            <span className="ml-1 text-xs font-semibold text-ink/40">años</span>
          </dd>
        </div>
        <div className="px-5 py-3">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">
            Grasa
          </dt>
          <dd className="metric-figures font-display text-xl font-bold text-ink">
            {student.bodyFatPercentage}
            <span className="ml-1 text-xs font-semibold text-ink/40">%</span>
          </dd>
        </div>
      </dl>

      <StudentProgressStrip progress={progress} />

      <div className="mt-auto flex flex-wrap items-center gap-2 p-5 pt-4">
        <span
          className={cn(
            'rounded-action border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]',
            LEVEL_BADGE[student.level]
          )}
        >
          {student.level}
        </span>

        {student.goals.map((goal) => (
          <span
            key={goal}
            className="rounded-action border border-cobalt-tint-3 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-ink/50"
          >
            {goal}
          </span>
        ))}

        <ArrowUpRight
          aria-hidden="true"
          className="ms-auto size-5 text-ink/25 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ember"
        />
      </div>

      <ConfirmDeleteDialog
        open={isDeleteOpen}
        name={fullName}
        kind="al alumno"
        blockedReason={blockedReason}
        onOpenChange={setIsDeleteOpen}
        onConfirm={() => {
          void deleteStudent(student.id).then((result) => {
            if (result.deleted) setIsDeleteOpen(false)
            else setBlockedReason(result.reason)
          })
        }}
      />
    </article>
  )
}
