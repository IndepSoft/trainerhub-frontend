import { InputWithIcon } from '@/shared/components/InputWithIcon'
import { Button } from '@/shared/ui/button'
import { Filter, Search } from 'lucide-react'

/**
 * Barra de búsqueda y filtros del listado.
 *
 * Estaba embebida en la página, que asi cargaba con dos cosas a la vez: la
 * disposicion general y los controles de filtrado.
 *
 * TODO: los controles todavia no filtran nada. Cuando lo hagan, el estado del
 * filtro vivira en `useStudents`, no aqui: este componente seguira siendo
 * presentacional y recibira valor y manejadores por props.
 */
export function StudentFilters() {
  return (
    <div className="flex items-center gap-4 justify-between">
      <div className="max-w-sm w-full">
        <InputWithIcon
          icon={<Search className="w-4 h-4" />}
          iconPosition="left"
          placeholder="Buscar estudiante..."
        />
      </div>
      <Button variant="outline" className="gap-2">
        <Filter className="h-4 w-4" />
        Filtros
      </Button>
    </div>
  )
}
