import { useState, type FormEvent } from 'react'
import { Button } from '@/shared/ui/button'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { useRequestPasswordReset } from '../hooks/useRequestPasswordReset'
import { AuthHero } from './AuthHero'
import { AuthScreen } from './AuthScreen'
import { FormField } from './FormField'
import { FormInput } from './FormInput'

interface ForgotPasswordFormProps {
  /** Con qué correo se venía del formulario de acceso, para no teclearlo dos veces. */
  initialEmail: string
  onBack: () => void
}

/**
 * Pedir el enlace para restablecer la contraseña.
 *
 * SUSTITUYE al formulario de acceso dentro de la misma pantalla, no abre otra
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

  const hero = (
    <AuthHero
      eyebrow={t('auth.hero.enter')}
      headlineLines={[t('auth.hero.reset.line1'), t('auth.hero.reset.line2')]}
      height="short"
      back={{ label: t('auth.reset.back'), onClick: onBack }}
    />
  )

  if (sentTo !== null) {
    return (
      <AuthScreen hero={hero}>
        <div className="flex flex-col gap-3">
          <p className="font-display text-xl font-extrabold uppercase leading-none tracking-tight text-ink">
            {t('auth.reset.sentTitle')}
          </p>
          <p className="text-sm leading-relaxed text-ink/70">
            {t('auth.reset.sentTo', { email: sentTo })}
          </p>
          <p className="text-xs leading-relaxed text-ink/45">{t('register.confirm.spam')}</p>
        </div>

        <div className="mt-auto pt-3">
          <Button type="button" className="w-full rounded-action" onClick={onBack}>
            {t('auth.reset.back')}
          </Button>
        </div>
      </AuthScreen>
    )
  }

  return (
    <AuthScreen hero={hero}>
      <p className="text-sm leading-relaxed text-ink/55">{t('auth.reset.hint')}</p>

      {error !== null && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5">
        <FormField htmlFor="reset-email" label={t('auth.email')}>
          <FormInput
            id="reset-email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={setEmail}
            disabled={loading}
            autoComplete="email"
            required
          />
        </FormField>

        <div className="mt-auto flex flex-col gap-3 pt-3">
          <Button type="submit" className="w-full rounded-action" disabled={loading}>
            {loading ? t('auth.reset.sending') : t('auth.reset.send')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full rounded-action text-ink/55"
            onClick={onBack}
          >
            {t('auth.reset.back')}
          </Button>
        </div>
      </form>
    </AuthScreen>
  )
}
