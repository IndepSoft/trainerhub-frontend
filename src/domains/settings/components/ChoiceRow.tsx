import { useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { ListRow } from '@/shared/components/ListRow'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { cn } from '@/shared/lib/utils'

export interface ChoiceOption<Value extends string> {
  value: Value
  /** Lo que se lee. Ya traducido: aquí no se sabe de diccionarios. */
  label: string
  icon?: ReactNode
}

interface ChoiceRowProps<Value extends string> {
  label: string
  value: Value
  options: ChoiceOption<Value>[]
  /** Lo que hay que saber ANTES de elegir. Se lee dentro, junto a las opciones. */
  hint?: string
  onChange: (value: Value) => void
}

/**
 * Una preferencia de una sola respuesta: la fila dice cuál está puesta y las
 * opciones se eligen dentro.
 *
 * ERAN TRES BOTONES APILADOS por preferencia. Tema e idioma se llevaban 270 px
 * de la pantalla de ajustes para dos decisiones que se toman una vez y no se
 * vuelven a tocar; en fila ocupan 128 y dicen lo mismo —cuál está puesta— de un
 * vistazo.
 *
 * El precio es un toque más para cambiarla, y es el correcto: lo que se mira a
 * menudo va en la fila, y lo que se hace de tanto en tanto, dentro.
 *
 * En móvil las opciones suben en una hoja, como todo diálogo (§44).
 */
export function ChoiceRow<Value extends string>({
  label,
  value,
  options,
  hint,
  onChange,
}: ChoiceRowProps<Value>) {
  const [open, setOpen] = useState(false)
  const current = options.find((option) => option.value === value)

  return (
    <>
      <ListRow
        primary={label}
        onSelect={() => setOpen(true)}
        chevron
        trailing={
          <span className="shrink-0 text-[13px] font-semibold text-ink/60">
            {current?.label ?? '—'}
          </span>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
            {hint !== undefined && <DialogDescription>{hint}</DialogDescription>}
          </DialogHeader>

          <div role="radiogroup" aria-label={label} className="flex flex-col">
            {options.map((option) => {
              const selected = option.value === value

              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    onChange(option.value)
                    // Elegir es terminar: quedarse abierto obliga a cerrar a mano
                    // algo que ya no pregunta nada.
                    setOpen(false)
                  }}
                  className={cn(
                    'flex min-h-14 items-center gap-3 border-b border-cobalt-tint-3 text-start text-[15px] transition-colors last:border-b-0',
                    selected ? 'font-semibold text-cobalt' : 'text-ink hover:text-cobalt'
                  )}
                >
                  {option.icon}
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  <Check
                    aria-hidden="true"
                    className={cn('size-5 shrink-0', selected ? 'opacity-100' : 'opacity-0')}
                  />
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
