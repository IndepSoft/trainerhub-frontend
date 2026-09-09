import { useEffect, useState } from 'react'
import { container } from '@/app/container'

/**
 * Cuántos anuncios del muro hay sin leer, para la entrada del equipo.
 *
 * Es lo barato que la deuda dejó escrito: un contador donde ya se mira, no una
 * notificación. Se recalcula con cada cambio del muro —publicar, borrar,
 * abrirlo— y el error se traga a propósito: un contador que no se puede leer
 * es un cero, no una pantalla rota.
 */
export function useWallUnread(crewId: string | null): number {
  const [unread, setUnread] = useState(0)

  // `crewId` es dependencia y no se usa dentro: el puerto ya esta acotado al
  // crew activo, pero cambiar de equipo tiene que volver a contar.
  useEffect(() => {
    let active = true

    const load = () => {
      container.crewPosts
        .countUnread()
        .then((count) => {
          if (active) setUnread(count)
        })
        .catch(() => {
          if (active) setUnread(0)
        })
    }

    load()
    const unsubscribe = container.crewPosts.onChange(load)

    return () => {
      active = false
      unsubscribe()
    }
  }, [crewId])

  return unread
}
