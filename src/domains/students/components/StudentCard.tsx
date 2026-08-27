import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Calendar, MoreHorizontal, TrendingUp } from 'lucide-react'
import { getInitials, getShortName } from '@/shared/utils/nameHelpers'
import type { Student, StudentLevel } from '../types/student.types'

/**
 * Color de cada nivel.
 *
 * Antes viajaba dentro del propio estudiante, como campo `levelColor`, lo que
 * obligaba a tocar los datos para cambiar un color y dejaba que el dominio
 * conociera clases de Tailwind. Como tabla es decisión de la vista, y `Record`
 * sobre la unión obliga a cubrir todos los niveles.
 */
const LEVEL_BADGE_COLOR: Record<StudentLevel, string> = {
  Principiante: 'bg-yellow-500',
  Intermedio: 'bg-blue-500',
  Avanzado: 'bg-green-500',
}

interface StudentCardProps {
  student: Student
}

export function StudentCard({ student }: StudentCardProps) {
  const fullName = getShortName(student.firstName, student.lastName)
  const initials = getInitials(student.firstName, student.lastName)

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <Avatar>
                <AvatarImage src={student.photoUrl} alt={fullName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-1 flex-1">
              <CardTitle className="text-xl">{fullName}</CardTitle>
              <CardDescription>{student.email}</CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Editar</DropdownMenuItem>
              <DropdownMenuItem>Duplicar</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-start flex-col">
            <span className="font-semibold">Edad</span>
            <span className="text-black font-bold">{student.age} años</span>
          </div>
          <div className="flex items-start flex-col">
            <span className="font-semibold">Nivel</span>
            <Badge className={`${LEVEL_BADGE_COLOR[student.level]} text-white`}>
              {student.level}
            </Badge>
          </div>
        </div>

        <div className="flex items-start text-md flex-col gap-1 text-sm text-gray-600">
          <span>Objetivos</span>
          <div className="text-black">
            {student.goals.map((goal) => (
              <Badge key={goal} variant="outline" className="text-xs mr-1">
                {goal}
              </Badge>
            ))}
          </div>
        </div>

        {/*
          Este bloque mostraba "Edad" otra vez, con el mismo valor que arriba.
          Era una duplicacion por copia y se elimina; el porcentaje de grasa se
          conserva.
          TODO: decidir que metrica acompaña aqui al % de grasa -peso, altura-.
        */}
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-start flex-col">
            <span className="font-semibold">% Grasa</span>
            <span className="font-bold text-black">
              {student.bodyFatPercentage}%
            </span>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row items-stretch gap-4 text-sm w-full">
          <Button variant="outline" className="flex-1 gap-2">
            <TrendingUp className="h-4 w-4" />
            Progreso
          </Button>
          <Button variant="outline" className="flex-1 gap-2">
            <Calendar className="h-4 w-4" />
            Agregar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
