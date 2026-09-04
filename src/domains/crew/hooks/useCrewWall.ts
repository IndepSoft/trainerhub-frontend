import { useCallback, useEffect, useState } from 'react'
import { container } from '@/app/container'
import { useAuthStore } from '@/app/stores/authStore'
import { AppError } from '@/shared/domain/errors'
import type { CrewPost } from '@/shared/domain/entities/crewPost'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface UseCrewWallResult {
  posts: CrewPost[]
  loading: boolean
  error: string | null
  publish: (body: string) => Promise<void>
  toggleLike: (postId: string) => Promise<void>
  removePost: (postId: string) => Promise<void>
  /** Si a quien mira le gusta este anuncio. */
  isLikedByViewer: (post: CrewPost) => boolean
}

/**
 * El muro del equipo activo.
 *
 * `isLikedByViewer` se resuelve aquí y no en el componente porque hace falta el
 * perfil de quien mira, y ése no es asunto de una tarjeta: pintar un anuncio no
 * debería obligar a saber quién ha iniciado sesión.
 *
 * Se suscribe a los cambios porque el «me gusta» es lo que más se pulsa de la
 * pantalla y tiene que responder sin recargar.
 */
export function useCrewWall(): UseCrewWallResult {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const [posts, setPosts] = useState<CrewPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (): Promise<void> => {
    try {
      setPosts(await container.crewPosts.findAll())
    } catch (caught) {
      setError(AppError.is(caught) ? caught.message : t('crew.wallError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
    return container.crewPosts.onChange(() => {
      void load()
    })
  }, [load])

  const publish = useCallback(
    async (body: string) => {
      if (user === null) return

      const trimmed = body.trim()
      // Un anuncio vacío no es un anuncio. Se comprueba aquí además de en el
      // formulario porque el formulario puede llamar desde un atajo de teclado.
      if (trimmed === '') return

      await container.crewPosts.create({ authorProfileId: user.id, body: trimmed })
    },
    [user]
  )

  const toggleLike = useCallback(
    async (postId: string) => {
      if (user === null) return
      await container.crewPosts.toggleLike(postId, user.id)
    },
    [user]
  )

  const removePost = useCallback(async (postId: string) => {
    await container.crewPosts.remove(postId)
  }, [])

  const isLikedByViewer = useCallback(
    (post: CrewPost) => user !== null && post.likedBy.includes(user.id),
    [user]
  )

  return { posts, loading, error, publish, toggleLike, removePost, isLikedByViewer }
}
