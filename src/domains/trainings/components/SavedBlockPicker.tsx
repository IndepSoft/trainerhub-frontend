import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { BLOCK_METHOD_LABELS, formatPrescription } from '../libs/routine.utils'
import { useTrainingCatalog } from '../hooks/useTrainingCatalog'
import type { SavedBlock } from '../types/training.types'

interface SavedBlockPickerProps {
  open: boolean
  savedBlocks: SavedBlock[]
  onOpenChange: (open: boolean) => void
  onInsert: (savedBlock: SavedBlock) => void
}

/**
 * Elegir un bloque guardado para insertarlo. Sólo presentación.
 *
 * Se muestra el CONTENIDO de cada entrada y no sólo su nombre: la biblioteca de
 * alguien que programa a diario tendrá entradas parecidas —«Superserie · Press
 * de banca, Remo» frente a otra con las mismas dos y distinto rango—, y el
 * nombre solo no basta para distinguirlas.
 */
export function SavedBlockPicker({
  open,
  savedBlocks,
  onOpenChange,
  onInsert,
}: SavedBlockPickerProps) {
  const { exercisesById } = useTrainingCatalog()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto p-0">
        <DialogHeader className="px-5 pt-5 text-left">
          <DialogTitle className="font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
            Insertar bloque
          </DialogTitle>
          <DialogDescription className="text-sm text-ink/50">
            Se añade una copia. Editarla después no toca la entrada guardada.
          </DialogDescription>
        </DialogHeader>

        {savedBlocks.length === 0 ? (
          <p className="px-5 pb-6 text-sm text-ink/45">
            Tu biblioteca está vacía. Guarda un bloque desde cualquier rutina con el botón de
            marcador y aparecerá aquí.
          </p>
        ) : (
          <ul className="divide-y divide-cobalt-tint-3 border-t border-cobalt-tint-3">
            {savedBlocks.map((saved) => (
              <li key={saved.id}>
                <button
                  type="button"
                  onClick={() => onInsert(saved)}
                  className="w-full px-5 py-4 text-start transition-colors hover:bg-cobalt-tint"
                >
                  <span className="block font-semibold text-ink">{saved.name}</span>
                  <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-ember-deep">
                    {BLOCK_METHOD_LABELS[saved.block.method]}
                  </span>
                  <span className="mt-2 block space-y-1">
                    {saved.block.exercises.map((prescribed) => (
                      <span
                        key={prescribed.id}
                        className="flex items-baseline justify-between gap-4 text-sm"
                      >
                        <span className="min-w-0 truncate text-ink/70">
                          {exercisesById.get(prescribed.exerciseId)?.name ?? 'Ejercicio'}
                        </span>
                        <span className="metric-figures shrink-0 text-ink/45">
                          {formatPrescription(prescribed)}
                        </span>
                      </span>
                    ))}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
