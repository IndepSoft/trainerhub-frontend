import { Eye } from 'lucide-react'

interface ObserverBannerProps {
  crewName: string
}

/**
 * El aviso de que se está mirando un equipo ajeno.
 *
 * NO ES DECORACIÓN, ES LO QUE EVITA UN MALENTENDIDO CARO. Un administrador de
 * plataforma entra a cualquier crew con las pantallas de gestión delante: el
 * padrón de alumnos, la agenda, el muro. Sin decirlo, es indistinguible de ser
 * el entrenador de ese equipo, y quien lo olvide se preguntará por qué no le
 * dejan tocar nada —o peor, creerá que la aplicación está rota—.
 *
 * Va arriba, ocupando el ancho, y en Ember: es lo único de la pantalla que
 * describe un estado excepcional, y el naranja está reservado en este sistema
 * para lo que reclama atención.
 */
export function ObserverBanner({ crewName }: ObserverBannerProps) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-ember/30 bg-ember/10 px-4 py-2">
      <Eye aria-hidden="true" className="size-4 shrink-0 text-ember-deep" />
      <p className="min-w-0 text-xs text-ember-deep">
        {/* El nombre del equipo, porque con varios abiertos es lo primero que se
            pierde de vista. */}
        Estás viendo <span className="font-semibold">{crewName}</span> como
        administrador. No puedes modificar nada.
      </p>
    </div>
  )
}
