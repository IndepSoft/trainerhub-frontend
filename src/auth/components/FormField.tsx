import type { ReactNode } from 'react'
import { Label } from '@/shared/ui/label'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface FormFieldProps {
  /**
   * Id del control que etiqueta. Se recibe explicitamente en vez de derivarlo
   * del texto: antes se generaba con `label.toLowerCase().replace(' ', '-')`,
   * pero ese id no se le pasaba a ningun input, asi que la etiqueta no estaba
   * asociada a nada y no funcionaba con lector de pantalla.
   */
  htmlFor: string
  label: string
  /**
   * Se marca lo OPCIONAL, no lo obligatorio. En estos formularios casi todo es
   * obligatorio, así que un asterisco en cada campo no distinguía nada; la
   * excepción es la que merece la marca.
   */
  optional?: boolean
  /** Lo que va a la derecha de la etiqueta: un enlace de «¿la olvidaste?». */
  trailing?: ReactNode
  /** Una línea de ayuda bajo el control. */
  hint?: string
  children: ReactNode
}

/**
 * Etiqueta y control, en el registro de línea de las pantallas de acceso.
 *
 * La etiqueta es la misma de los formularios del resto de la aplicación —11 px,
 * mayúsculas, espaciado ancho— para que el alta no parezca de otro producto.
 */
export function FormField({
  htmlFor,
  label,
  optional = false,
  trailing,
  hint,
  children,
}: FormFieldProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <Label
          htmlFor={htmlFor}
          className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60"
        >
          {label}
          {optional && (
            <span className="ml-1 font-medium tracking-[0.08em] text-ink/40">
              · {t('register.optional')}
            </span>
          )}
        </Label>
        {trailing}
      </div>
      {children}
      {hint !== undefined && <p className="text-xs leading-relaxed text-ink/45">{hint}</p>}
    </div>
  )
}
