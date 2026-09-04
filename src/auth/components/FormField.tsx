import type { ReactNode } from 'react'
import { Label } from '@/shared/ui/label'

interface FormFieldProps {
  /**
   * Id del control que etiqueta. Se recibe explicitamente en vez de derivarlo
   * del texto: antes se generaba con `label.toLowerCase().replace(' ', '-')`,
   * pero ese id no se le pasaba a ningun input, asi que la etiqueta no estaba
   * asociada a nada y no funcionaba con lector de pantalla.
   */
  htmlFor: string
  label: string
  required?: boolean
  children: ReactNode
}

export function FormField({
  htmlFor,
  label,
  required = false,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
    </div>
  )
}
