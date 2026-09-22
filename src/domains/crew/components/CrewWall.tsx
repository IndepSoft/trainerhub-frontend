import { useState, type FormEvent } from 'react'
import { Heart, Megaphone, Trash2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Textarea } from '@/shared/ui/textarea'
import { cn } from '@/shared/lib/utils'
import { CREW_POST_MAX_LENGTH } from '@/shared/domain/entities/crewPost'
import { useCrewWall } from '../hooks/useCrewWall'
import { describePostTime } from '../libs/postTime'
import type { CrewPost } from '@/shared/domain/entities/crewPost'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface CrewWallProps {
  /** Si quien mira es del equipo técnico. Cambia lo que dice el muro vacío. */
  isStaff: boolean
  /**
   * Si además puede publicar y borrar.
   *
   * Distinto de `isStaff` porque la capacidad se puede prestar: un alumno
   * veterano al que se le deja anunciar cosas publica sin ser plantilla, y un
   * entrenador al que no se le ha dado la llave sigue siéndolo sin publicar.
   */
  canPublish: boolean
  /** Cómo se firma el anuncio. Es el nombre de quien entrena el equipo. */
  authorName: string
}

/**
 * El muro del equipo: anuncios del entrenador, y «me gusta» de todos.
 *
 * PUBLICA SÓLO QUIEN ENTRENA. Eso lo convierte en un canal de anuncios en vez de
 * en una red social, y con ello desaparece todo el trabajo permanente que
 * arrastraría lo segundo: moderar, denunciar, bloquear. Los alumnos participan
 * con el «me gusta», que basta para saber si algo se ha leído.
 */
export function CrewWall({ isStaff, canPublish, authorName }: CrewWallProps) {
  const { t } = useTranslation()
  const { posts, loading, publish, toggleLike, removePost, isLikedByViewer } = useCrewWall()
  const [draft, setDraft] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (draft.trim() === '') return

    await publish(draft)
    setDraft('')
  }

  return (
    <section className="space-y-4 pt-2" aria-labelledby="muro-titulo">
      {/* El encabezado sólo lo oyen los lectores de pantalla: la pestaña de
          arriba ya dice «Muro», y repetirlo debajo era la misma palabra dos
          veces seguidas. Se queda en el árbol porque es lo que nombra a la
          sección. */}
      <h2 id="muro-titulo" className="sr-only">
        {t('crew.wall')}
      </h2>

      {canPublish && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <label htmlFor="muro-anuncio" className="sr-only">
            {t('crew.wallCompose')}
          </label>
          {/* Cuadro y boton en UNA fila: el boton cabe junto al cuadro y no
              hace falta una fila entera para el. En movil va sin texto, con
              su nombre en `aria-label`; el megafono ya dice lo que hace. */}
          <div className="flex items-end gap-2">
            <Textarea
              id="muro-anuncio"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={CREW_POST_MAX_LENGTH}
              rows={2}
              placeholder={t('crew.wallPlaceholder')}
              className="min-w-0 flex-1 resize-none"
            />
            <Button
              type="submit"
              className="w-11 shrink-0 rounded-action px-0 md:w-auto md:px-4"
              aria-label={t('crew.wallPublish')}
              disabled={draft.trim() === ''}
            >
              <Megaphone />
              <span className="hidden md:inline">{t('crew.wallPublish')}</span>
            </Button>
          </div>

          {/* El contador aparece cerca del final, no siempre: un número
              permanente junto a un campo de texto invita a escribir corto en
              vez de a escribir lo que hace falta. */}
          {draft.length > CREW_POST_MAX_LENGTH - 80 && (
            <p className="text-xs text-ink/60">
              {t('crew.wallRemaining', { count: CREW_POST_MAX_LENGTH - draft.length })}
            </p>
          )}
        </form>
      )}

      {!loading && posts.length === 0 ? (
        <p className="py-6 text-sm text-ink/60">
          {isStaff
            ? t('crew.wallEmptyTrainer')
            : t('crew.wallEmptyStudent')}
        </p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              authorName={authorName}
              liked={isLikedByViewer(post)}
              canDelete={canPublish}
              onToggleLike={() => void toggleLike(post.id)}
              onDelete={() => void removePost(post.id)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

interface PostCardProps {
  post: CrewPost
  authorName: string
  liked: boolean
  canDelete: boolean
  onToggleLike: () => void
  onDelete: () => void
}

function PostCard({
  post,
  authorName,
  liked,
  canDelete,
  onToggleLike,
  onDelete,
}: PostCardProps) {
  const { t } = useTranslation()
  const likeCount = post.likeCount

  return (
    <li className="rounded-block border border-cobalt-tint-3 bg-surface p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
          {authorName}
        </p>
        <p className="shrink-0 text-xs text-ink/60">{describePostTime(post.createdAt, t)}</p>
      </div>

      {/* `whitespace-pre-line`: quien escribe un anuncio separa los parrafos con
          saltos de linea, y sin esto se pintaria todo seguido. */}
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink/80">{post.body}</p>

      <div className="mt-3 flex items-center gap-1">
        <button
          type="button"
          aria-pressed={liked}
          aria-label={liked ? t('crew.wallUnlike') : t('crew.wallLike')}
          onClick={onToggleLike}
          className={cn(
            // `min-w-11` acompaña a `min-h-11`: sin cuenta que pintar, el
            // botón es sólo el corazón y medía 40 px de ancho, por debajo del
            // objetivo táctil de 44 que exige la regla 1.6.
            'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-action px-3 text-sm font-semibold transition-colors',
            liked ? 'text-ember' : 'text-ink/60 hover:text-ink'
          )}
        >
          <Heart className="size-4" fill={liked ? 'currentColor' : 'none'} />
          {/* El cero no se pinta: «0» junto a un corazon se lee como un
              reproche, y lo que dice es lo mismo que no decir nada. */}
          {likeCount > 0 && <span className="metric-figures">{likeCount}</span>}
        </button>

        {canDelete && (
          <button
            type="button"
            aria-label={t('crew.wallDelete')}
            onClick={onDelete}
            className="ms-auto inline-flex size-11 items-center justify-center rounded-action text-ink/50 transition-colors hover:text-danger"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </li>
  )
}
