import { useState, type FormEvent } from 'react'
import { MailCheck } from 'lucide-react'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { useRequestPasswordReset } from '../hooks/useRequestPasswordReset'

interface ForgotPasswordFormProps {
  /** Con qué correo se venía del formulario de acceso, para no teclearlo dos veces. */
  initialEmail: string
  onBack: () => void
}

/**
 * Pedir el enlace para restablecer la contraseña.
 *
 * SUSTITUYE al formulario de acceso dentro de la misma pestaña, no abre otra
 * ruta: es un desvío de un paso y se vuelve con un botón. Una ruta propia
 * habría que protegerla como invitado y aparecería en el historial.
 *
 * Al enviar se enseña LA DIRECCIÓN y no «hecho»: la respuesta es la misma
 * exista o no la cuenta —lo decide el puerto, a propósito—, así que lo único
 * que quien espera puede comprobar es si escribió bien el correo.
 */
export function ForgotPasswordForm({ initialEmail, onBack }: ForgotPasswordFormProps) {
  const { t } = useTranslation()
  const [email, setEmail] = useState(initialEmail)
  const { loading, error, sentTo, request } = useRequestPasswordReset()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await request(email)
  }

  if (sentTo !== null) {
    return (
      <>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-cobalt-tint-2">
            <MailCheck aria-hidden="true" className="size-6 text-cobalt" />
          </div>
          <CardTitle className="text-xl font-semibold">{t('auth.reset.sentTitle')}</CardTitle>
          <CardDescription>{t('auth.reset.sentTo', { email: sentTo })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-2 text-center">
          <p className="text-xs text-ink/45">{t('register.confirm.spam')}</p>
          <Button type="button" variant="outline" className="w-full" onClick={onBack}>
            {t('auth.reset.back')}
          </Button>
        </CardContent>
      </>
    )
  }

  return (
    <>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold text-center">{t('auth.reset.title')}</CardTitle>
        <CardDescription className="text-center">{t('auth.reset.hint')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error !== null && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">{t('auth.email')}</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
              required
              autoComplete="email"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('auth.reset.sending') : t('auth.reset.send')}
          </Button>
          <Button type="button" variant="link" className="w-full font-normal" onClick={onBack}>
            {t('auth.reset.back')}
          </Button>
        </form>
      </CardContent>
    </>
  )
}
