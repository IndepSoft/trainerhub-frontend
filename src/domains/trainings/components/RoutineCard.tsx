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
import { Clock, Copy, Dumbbell, MoreVertical, Play } from 'lucide-react'
import type { Routine, TrainingLevel } from '../types/training.types'

/**
 * Color de cada nivel.
 *
 * Antes viajaba en el dato como `levelColor`. Misma tabla que en StudentCard:
 * el color es decision de la vista, y `Record` sobre la union obliga a cubrir
 * los tres niveles.
 */
const LEVEL_BADGE_COLOR: Record<TrainingLevel, string> = {
  // Rampa `--scale-*`, fuera de la marca a proposito: si «Intermedio» usara
  // Cobalt, una etiqueta de nivel se leeria como un boton primario. Unifica
  // ademas las dos escalas que no coincidian entre dominios: aqui
  // «Principiante» era amarillo y en el otro naranja, que ademas chocaba
  // con Ember.
  Principiante: 'bg-scale-1',
  Intermedio: 'bg-scale-2',
  Avanzado: 'bg-scale-3',
}

interface RoutineCardProps {
  routine: Routine
}

export function RoutineCard({ routine }: RoutineCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-xl">{routine.title}</CardTitle>
            <CardDescription>{routine.description}</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Editar</DropdownMenuItem>
              <DropdownMenuItem>Duplicar</DropdownMenuItem>
              <DropdownMenuItem className="text-danger">
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/*
          El nivel se mostraba dos veces: aqui como insignia de color y otra vez
          justo debajo como insignia de contorno, con el mismo texto. Se conserva
          solo esta.
        */}
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            <span>{routine.exercises.length} ejercicios</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{routine.durationMinutes} min</span>
          </div>
          <Badge className={`${LEVEL_BADGE_COLOR[routine.level]} text-white`}>
            {routine.level}
          </Badge>
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-3">Ejercicios principales:</h4>
          <div className="space-y-2">
            {routine.exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="flex justify-between items-center text-sm"
              >
                <span className="text-gray-700">{exercise.name}</span>
                <span className="text-gray-500">{exercise.prescription}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1 gap-2">
            <Copy className="h-4 w-4" />
            Usar
          </Button>
          <Button variant="outline" className="flex-1 gap-2">
            <Play className="h-4 w-4" />
            Vista previa
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
