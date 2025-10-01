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

interface Student {
  id: number
  name: string
  email: string
  level: string
  levelColor: string
  photoUrl?: string
  goals?: string[]
}

interface StudentCardProps {
  student: Student
}

export function StudentCard({ student }: StudentCardProps) {
  return (
    <Card key={student.id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <Avatar>
                <AvatarImage src={student.photoUrl || ''} alt="@shadcn" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-1 flex-1">
              <CardTitle className="text-xl">{student.name}</CardTitle>
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
        {/* First Section */}
        <div className="flex items-center gap-6 text-sm text-gray-600 ">
          <div className="flex items-start flex-col">
            <span className="font-semibold">Edad</span>
            <span className="text-black font-bold">{10} años</span>
          </div>
          <div className="flex items-start flex-col">
            <span className="font-semibold">Nivel</span>
            <Badge
              className={`${student.levelColor} text-white hover:${student.levelColor}`}
            >
              {student.level}
            </Badge>
          </div>
        </div>

        {/* Second Section */}
        <div className=" flex items-start text-md flex-col gap-1 text-sm text-gray-600">
          <span>Objetivos</span>
          <div className="text-black">
            {student.goals?.map((goal, idx) => (
              <Badge key={idx} variant="outline" className="text-xs mr-1">
                {goal}
              </Badge>
            ))}
          </div>
        </div>

        {/* Third Section */}
        <div className=" flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-start flex-col">
            <span className="font-semibold">Edad</span>
            <span className="font-bold text-black">{10} años</span>
          </div>
          <div className="flex items-start flex-col">
            <span className="font-semibold">% Grasa</span>
            <span className="font-bold text-black">{22}%</span>
          </div>
        </div>

        {/* Four Section */}
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
