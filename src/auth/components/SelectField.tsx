import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { cn } from '@/shared/lib/utils'
import { LINE_CONTROL_CLASS } from './FormInput'

interface SelectFieldProps {
  id: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  options: string[]
}

/**
 * Un desplegable de las pantallas de acceso, en el registro de línea.
 *
 * Sigue siendo el `Select` de shadcn —el panel, el teclado y el lector de
 * pantalla vienen de ahí— y sólo se viste el disparador como el campo de texto
 * de al lado. `shadow-none` y `focus-visible:ring-0` quitan lo que el
 * disparador trae de fábrica; la línea inferior en Cobalt al enfocar es el
 * mismo aviso que da el campo de texto.
 */
export function SelectField({ id, placeholder, value, onChange, options }: SelectFieldProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        id={id}
        className={cn(
          LINE_CONTROL_CLASS,
          'justify-between py-0 shadow-none focus-visible:border-cobalt focus-visible:ring-0 data-[placeholder]:text-ink/35'
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
