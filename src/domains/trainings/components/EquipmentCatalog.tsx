import { useId, useMemo, useState, type FormEvent } from 'react'
import { AlertCircle, Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { useTrainingCatalog } from '../hooks/useTrainingCatalog'
import { useCatalogEditor } from '../hooks/useCatalogEditor'
import { findExercisesUsingEquipment } from '../libs/usage'
import type { Equipment } from '../types/catalog.types'
import type { EquipmentDraft } from '../types/catalogDraft.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { catalogEnumLabel, catalogLabel } from '@/shared/i18n/domainLabels'

/** Registro de etiqueta del formulario, igual que en el resto del dominio. */
const FIELD_LABEL = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50'

/**
 * Se llama EQUIPAMIENTO y no «máquinas» a propósito: barra, mancuernas, polea,
 * kettlebell, banda y peso corporal no son máquinas, y son la mayor parte del
 * entrenamiento. La clase lo dice explícitamente para que no haya que meterlos
 * donde no encajan.
 */
const EQUIPMENT_KINDS: Equipment['kind'][] = [
  'peso libre',
  'máquina',
  'accesorio',
  'peso corporal',
]

function createEmptyEquipmentDraft(): EquipmentDraft {
  return { name: '', kind: 'peso libre' }
}

/**
 * El catálogo de material: listado, alta, edición y baja.
 *
 * Se edita EN LA FILA y no en un diálogo, al revés que el ejercicio. Un material
 * son dos campos —nombre y tipo—, y abrir una ventana para dos campos hace más
 * lento lo que debería ser instantáneo. El ejercicio tiene siete y sí lo pide.
 */
export function EquipmentCatalog() {
  const { t } = useTranslation()
  const fieldId = useId()
  const { equipment, exercises } = useTrainingCatalog()
  const { createEquipment, updateEquipment, deleteEquipment } = useCatalogEditor()

  const [newDraft, setNewDraft] = useState<EquipmentDraft>(createEmptyEquipmentDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<EquipmentDraft>(createEmptyEquipmentDraft)
  const [blockedReason, setBlockedReason] = useState<string | null>(null)

  const usageByEquipment = useMemo(() => {
    const usage = new Map<string, number>()
    for (const item of equipment) {
      usage.set(item.id, findExercisesUsingEquipment(exercises, item.id).length)
    }
    return usage
  }, [equipment, exercises])

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (newDraft.name.trim() === '') return

    createEquipment({ name: newDraft.name.trim(), kind: newDraft.kind })
    setNewDraft(createEmptyEquipmentDraft())
    setBlockedReason(null)
  }

  const startEditing = (item: Equipment) => {
    setEditingId(item.id)
    setEditDraft({ name: item.name, kind: item.kind })
    setBlockedReason(null)
  }

  const confirmEditing = () => {
    if (editingId === null || editDraft.name.trim() === '') return

    updateEquipment(editingId, { name: editDraft.name.trim(), kind: editDraft.kind })
    setEditingId(null)
  }

  const handleDelete = (item: Equipment) => {
    const result = deleteEquipment(item.id)
    setBlockedReason(
      result.deleted
        ? null
        : t('equipment.cannotDelete', { name: item.name, reason: result.reason })
    )
  }

  return (
    <section className="px-4 pb-6">
      <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <Label htmlFor={`${fieldId}-name`} className={FIELD_LABEL}>
            {t('equipment.new')}
          </Label>
          <Input
            id={`${fieldId}-name`}
            className="mt-1.5"
            placeholder={t('equipment.namePlaceholder')}
            value={newDraft.name}
            onChange={(event) => setNewDraft((current) => ({ ...current, name: event.target.value }))}
          />
        </div>

        <div className="sm:w-48">
          <Label htmlFor={`${fieldId}-kind`} className={FIELD_LABEL}>
            {t('equipment.kind')}
          </Label>
          <Select
            value={newDraft.kind}
            onValueChange={(kind) =>
              setNewDraft((current) => ({ ...current, kind: kind as Equipment['kind'] }))
            }
          >
            <SelectTrigger id={`${fieldId}-kind`} className="mt-1.5 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EQUIPMENT_KINDS.map((kind) => (
                <SelectItem key={kind} value={kind}>
                  {catalogEnumLabel(kind, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" className="gap-2" disabled={newDraft.name.trim() === ''}>
          <Plus className="size-4" />
          {t('equipment.add')}
        </Button>
      </form>

      {blockedReason !== null && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-block border border-danger/40 bg-danger-surface px-4 py-3 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {blockedReason}
        </p>
      )}

      <ul className="mt-5 divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3">
        {equipment.map((item) => {
          const usedIn = usageByEquipment.get(item.id) ?? 0

          if (editingId === item.id) {
            return (
              <li key={item.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center">
                <Input
                  aria-label={t('equipment.nameOf', { name: item.name })}
                  className="min-w-0 flex-1"
                  value={editDraft.name}
                  onChange={(event) =>
                    setEditDraft((current) => ({ ...current, name: event.target.value }))
                  }
                />
                <Select
                  value={editDraft.kind}
                  onValueChange={(kind) =>
                    setEditDraft((current) => ({ ...current, kind: kind as Equipment['kind'] }))
                  }
                >
                  <SelectTrigger
                    aria-label={t('equipment.kindOf', { name: item.name })}
                    className="w-full sm:w-44"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_KINDS.map((kind) => (
                      <SelectItem key={kind} value={kind}>
                        {catalogEnumLabel(kind, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex shrink-0 items-center">
                  <button
                    type="button"
                    onClick={confirmEditing}
                    aria-label={t('equipment.saveName')}
                    className="inline-flex size-11 items-center justify-center rounded-action text-ink/35 transition-colors hover:bg-cobalt-tint hover:text-cobalt"
                  >
                    <Check className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    aria-label={t('equipment.discard')}
                    className="inline-flex size-11 items-center justify-center rounded-action text-ink/35 transition-colors hover:text-ink"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </li>
            )
          }

          return (
            <li key={item.id} className="flex items-center gap-3 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{catalogLabel(item.id, item.name, t)}</p>
                <p className="mt-0.5 text-xs text-ink/45">
                  {catalogEnumLabel(item.kind, t)}
                  {usedIn > 0 && ` · en ${usedIn} ${usedIn === 1 ? 'ejercicio' : 'ejercicios'}`}
                </p>
              </div>

              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => startEditing(item)}
                  aria-label={t('exercise.editLabel', { name: item.name })}
                  className="inline-flex size-11 items-center justify-center rounded-action text-ink/35 transition-colors hover:bg-cobalt-tint hover:text-cobalt"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  aria-label={t('exercise.deleteLabel', { name: item.name })}
                  className="inline-flex size-11 items-center justify-center rounded-action text-ink/35 transition-colors hover:bg-danger-surface hover:text-danger"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
