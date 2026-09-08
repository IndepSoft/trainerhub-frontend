import { useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { useUpdatePassword } from '../hooks/useUpdatePassword'

interface PasswordFieldsProps {
  /** Qué hacer cuando la contraseña ya está cambiada. Cada puerta decide. */
  onSaved: () => void
  /**
   * Prefijo de los ids de los campos: el mismo formulario puede aparecer dos
   * veces en la aplicación y las etiquetas tienen que apuntar cada una al suyo.
   */
  idPrefix: string
}

/**
 * Los dos campos de una contraseña nueva, con su envío.
 *
 * ES EL MISMO FORMULARIO en la vuelta del correo de recuperación y en
 * Configuración: validación, error y acuse iguales. Lo que cambia es lo que
 * pasa después —volver a la aplicación, o quedarse—, y eso llega por `onSaved`.
 */
export function PasswordFields({ onSaved, idPrefix }: PasswordFieldsProps) {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [justSaved, setJustSaved] = useState(false)
  const { loading, error, update } = useUpdatePassword()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const saved = await update(password, confirmation)
    if (!saved) return

    setPassword('')
    setConfirmation('')
    setJustSaved(true)
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error !== null && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-password`}>{t('auth.newPassword.password')}</Label>
        <Input
          id={`${idPrefix}-password`}
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            setJustSaved(false)
          }}
          disabled={loading}
          required
          autoComplete="new-password"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-confirmation`}>{t('auth.newPassword.confirm')}</Label>
        <Input
          id={`${idPrefix}-confirmation`}
          type="password"
          value={confirmation}
          onChange={(event) => {
            setConfirmation(event.target.value)
            setJustSaved(false)
          }}
          disabled={loading}
          required
          autoComplete="new-password"
        />
      </div>

      <Button type="submit" className="w-full gap-2" disabled={loading}>
        {justSaved ? <Check className="size-4" /> : null}
        {loading
          ? t('auth.newPassword.saving')
          : justSaved
            ? t('auth.newPassword.saved')
            : t('auth.newPassword.save')}
      </Button>
    </form>
  )
}
