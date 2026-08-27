import { InputWithIcon } from '@/shared/components/InputWithIcon'
import { Button } from '@/shared/ui/button'
import { Filter, Search } from 'lucide-react'

/**
 * Barra de busqueda y filtros de rutinas.
 *
 * TODO: todavia no filtra nada. Cuando lo haga, el estado vivira en
 * `useRoutines` y este componente seguira siendo presentacional, recibiendo
 * valor y manejadores por props.
 */
export function TrainingFilters() {
  return (
    <div className="flex items-center gap-4 justify-between">
      <div className="max-w-sm w-full">
        <InputWithIcon
          icon={<Search className="w-4 h-4" />}
          iconPosition="left"
          placeholder="Buscar rutinas..."
        />
      </div>
      <Button variant="outline" className="gap-2">
        <Filter className="h-4 w-4" />
        Filtros
      </Button>
    </div>
  )
}
