import { useState } from 'react'
import { BookmarkPlus, Check, Pencil, Trash2, X } from 'lucide-react'
import { Input } from '@/shared/ui/input'
import { useBlockLibrary } from '../hooks/useBlockLibrary'
import { useTrainingCatalog } from '../hooks/useTrainingCatalog'
import { BLOCK_METHOD_LABELS, formatPrescription, formatRest } from '../libs/routine.utils'
import type { SavedBlock } from '../types/training.types'

/**
 * La biblioteca de bloques: consultar, renombrar y borrar.
 *
 * Aquí NO se crean entradas, y es deliberado. Un bloque se guarda desde la
 * rutina en la que se acaba de componer, que es el momento en que uno sabe que
 * le va a servir; obligarle a rehacerlo aquí desde cero sería pedirle el trabajo
 * dos veces.
 *
 * Tampoco se editan sus ejercicios: se inserta en una rutina y se edita allí. El
 * contenido de una entrada es una foto de una decisión, y editarla en el sitio
 * sugeriría que ese cambio alcanza a las rutinas que la usaron, que es
 * exactamente lo que el diseño de copia evita.
 */
export function BlockLibrary() {
  const { savedBlocks, renameBlock, deleteBlock } = useBlockLibrary()
  const { exercisesById } = useTrainingCatalog()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedName, setEditedName] = useState('')

  const startRenaming = (saved: SavedBlock) => {
    setEditingId(saved.id)
    setEditedName(saved.name)
  }

  const confirmRenaming = () => {
    if (editingId === null || editedName.trim() === '') return

    renameBlock(editingId, editedName.trim())
    setEditingId(null)
  }

  if (savedBlocks.length === 0) {
    return (
      <section className="flex flex-col items-center px-6 py-16 text-center">
        <span className="mb-5 flex size-16 items-center justify-center rounded-full border-2 border-cobalt/30 bg-cobalt-tint">
          <BookmarkPlus className="size-7 text-cobalt" strokeWidth={1.75} />
        </span>
        <h3 className="font-display text-2xl font-extrabold uppercase tracking-tight text-ink">
          Sin bloques guardados
        </h3>
        <p className="mt-2 max-w-sm text-sm text-ink/50">
          Al componer una rutina, guarda un bloque con el botón de marcador y aparecerá aquí
          para volver a insertarlo cuando quieras.
        </p>
      </section>
    )
  }

  return (
    <section className="px-4 pb-6">
      <p className="rounded-block border border-cobalt-tint-3 bg-cobalt-tint px-4 py-3 text-sm text-ink/60">
        Al insertar uno de estos bloques en una rutina se añade una <strong>copia</strong>.
        Editarla allí no toca esta entrada, y borrar esta entrada no rompe ninguna rutina.
      </p>

      <ul className="mt-5 space-y-4">
        {savedBlocks.map((saved) => (
          <li key={saved.id} className="rounded-block border border-cobalt-tint-3 bg-surface p-4">
            <div className="flex items-start gap-2">
              {editingId === saved.id ? (
                <>
                  <Input
                    aria-label={`Nombre de ${saved.name}`}
                    className="min-w-0 flex-1"
                    value={editedName}
                    onChange={(event) => setEditedName(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={confirmRenaming}
                    aria-label="Guardar el nombre"
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-action text-ink/35 transition-colors hover:bg-cobalt-tint hover:text-cobalt"
                  >
                    <Check className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    aria-label="Descartar el nombre"
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-action text-ink/35 transition-colors hover:text-ink"
                  >
                    <X className="size-4" />
                  </button>
                </>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{saved.name}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ember-deep">
                      {BLOCK_METHOD_LABELS[saved.block.method]}
                      <span className="metric-figures font-semibold tracking-normal text-ink/40">
                        descanso {formatRest(saved.block.restAfterSeconds)}
                      </span>
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center">
                    <button
                      type="button"
                      onClick={() => startRenaming(saved)}
                      aria-label={`Renombrar ${saved.name}`}
                      className="inline-flex size-11 items-center justify-center rounded-action text-ink/35 transition-colors hover:bg-cobalt-tint hover:text-cobalt"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteBlock(saved.id)}
                      aria-label={`Eliminar ${saved.name}`}
                      className="inline-flex size-11 items-center justify-center rounded-action text-ink/35 transition-colors hover:bg-danger-surface hover:text-danger"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </>
              )}
            </div>

            <ul className="mt-3 space-y-2 border-t border-cobalt-tint-3 pt-3">
              {saved.block.exercises.map((prescribed) => (
                <li
                  key={prescribed.id}
                  className="flex items-baseline justify-between gap-4 text-sm"
                >
                  <span className="min-w-0 truncate text-ink/70">
                    {exercisesById.get(prescribed.exerciseId)?.name ?? 'Ejercicio'}
                  </span>
                  <span className="metric-figures shrink-0 text-ink/45">
                    {formatPrescription(prescribed)}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  )
}
