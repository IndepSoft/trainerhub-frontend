import type { HTMLInputAutoCompleteAttribute } from 'react'
import { cn } from '@/shared/lib/utils'

/**
 * El control de línea: sólo el borde inferior, sin caja.
 *
 * Se comparte con el desplegable para que los dos se vean iguales en la misma
 * fila. `h-11` son los 44 px del objetivo táctil; `text-base` evita que iOS
 * amplíe la pantalla al enfocar, que lo hace con cualquier campo por debajo
 * de 16 px.
 */
export const LINE_CONTROL_CLASS =
  'h-11 w-full rounded-none border-0 border-b border-ink/20 bg-transparent px-0 text-base text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-cobalt disabled:opacity-50'

interface FormInputProps {
  id: string
  type?: 'text' | 'email' | 'password'
  placeholder?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  autoComplete?: HTMLInputAutoCompleteAttribute
  /** Para el código del equipo: se escribe en mayúsculas y con más cuerpo. */
  emphasized?: boolean
}

/**
 * Un campo de texto de las pantallas de acceso.
 *
 * Es un `<input>` y no el `Input` de shadcn: aquel trae caja, radio, sombra y
 * anillo, y quitárselos uno a uno para dejar una línea es pelear con el
 * componente. El de shadcn sigue siendo el de toda la aplicación; éste es el
 * del alta.
 */
export function FormInput({
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  autoComplete,
  emphasized = false,
}: FormInputProps) {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      disabled={disabled}
      autoComplete={autoComplete}
      className={cn(
        LINE_CONTROL_CLASS,
        emphasized && 'font-display text-[1.375rem] font-bold uppercase tracking-[0.12em]'
      )}
    />
  )
}
