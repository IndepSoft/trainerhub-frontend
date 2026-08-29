import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Card, CardContent } from '@/shared/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Calendar, ChevronRight, MoreHorizontal, TrendingUp } from 'lucide-react'
import { getInitials, getShortName } from '@/shared/lib/personName'
import { useLongPress } from '@/shared/hooks/useLongPress'
import { cn } from '@/shared/lib/utils'
import { LEVEL_BADGE } from '../libs/levelBadge'
import type { Student } from '../types/student.types'

interface StudentCardProps {
  student: Student
}

/**
 * Tarjeta de estudiante. La tarjeta ENTERA es el destino.
 *
 * El enlace envuelve el nombre y se estira sobre toda la tarjeta con un
 * pseudoelemento (`after:absolute after:inset-0`). Es deliberado y no un truco:
 *
 *  - Un `<button>` dentro de un `<a>` es HTML invalido, y en movil el navegador
 *    resuelve el conflicto de forma impredecible. El menu de acciones tiene que
 *    quedar FUERA del enlace, y por eso el enlace no puede envolver la tarjeta.
 *  - El texto del enlace es el nombre, no «ver mas». Un lector de pantalla
 *    anuncia «Juan Perez, enlace», que es lo util.
 *  - El area de toque acaba siendo la tarjeta completa, que en un telefono son
 *    unos 300 x 200 px en vez de los 44 de un boton.
 */
export function StudentCard({ student }: StudentCardProps) {
  const navigate = useNavigate()
  const fullName = getShortName(student.firstName, student.lastName)
  const initials = getInitials(student.firstName, student.lastName)

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { handlers: longPressHandlers } = useLongPress({
    onLongPress: () => setIsMenuOpen(true),
  })

  return (
    <Card
      className={cn(
        'group relative border-cobalt-tint-3 shadow-none transition-colors',
        // Sin `hover:shadow-lg` ni `hover:scale`: el canto se aviva, que es la
        // misma respuesta que la placa de logro.
        'hover:border-cobalt/40 focus-within:border-cobalt'
      )}
      {...longPressHandlers}
    >
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <Avatar className="size-11 shrink-0">
            <AvatarImage src={student.photoUrl} alt="" />
            <AvatarFallback className="bg-cobalt-tint-2 text-cobalt">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-ink">
              <Link
                to={`/students/${student.id}`}
                className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:underline"
              >
                {fullName}
              </Link>
            </h3>
            <p className="truncate text-sm text-ink/45">{student.email}</p>
          </div>

          {/*
            `relative z-10` para quedar POR ENCIMA del enlace estirado. Sin esto
            el enlace cubriria el boton y abrir el menu seria imposible.
            TODO: ninguna de las cinco acciones esta conectada.
          */}
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Acciones para ${fullName}`}
                className="relative z-10 -me-2 -mt-1 inline-flex size-11 shrink-0 items-center justify-center rounded-action text-ink/35 transition-colors hover:text-ink"
              >
                <MoreHorizontal className="size-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => navigate(`/students/${student.id}`)}>
                <TrendingUp className="me-2 size-4" />
                Ver ficha
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Calendar className="me-2 size-4" />
                Agendar sesión
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Editar</DropdownMenuItem>
              <DropdownMenuItem>Duplicar</DropdownMenuItem>
              <DropdownMenuItem className="text-danger">Eliminar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span
            className={cn(
              'rounded-action border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
              LEVEL_BADGE[student.level]
            )}
          >
            {student.level}
          </span>
          <p className="metric-figures text-sm text-ink/60">
            {student.age} años
            <span className="mx-2 text-ink/25">·</span>
            {student.bodyFatPercentage} % grasa
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {student.goals.map((goal) => (
            <span
              key={goal}
              className="rounded-action border border-cobalt-tint-3 px-2 py-0.5 text-[11px] text-ink/55"
            >
              {goal}
            </span>
          ))}
        </div>

        {/* Afordancia de que la tarjeta lleva a algun sitio. Decorativa: el
            enlace real es el nombre. */}
        <ChevronRight
          aria-hidden="true"
          className="absolute bottom-4 right-4 size-4 text-ink/20 transition-colors group-hover:text-cobalt"
        />
      </CardContent>
    </Card>
  )
}
