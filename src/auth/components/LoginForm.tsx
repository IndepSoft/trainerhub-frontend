import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { useLogin } from '../hooks/useLogin'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { authViewSearch } from '../libs/authView'
import { AuthHero } from './AuthHero'
import { AuthScreen } from './AuthScreen'
import { FormField } from './FormField'
import { FormInput } from './FormInput'
import { ForgotPasswordForm } from './ForgotPasswordForm'

export function LoginForm() {
  const { t } = useTranslation()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [recovering, setRecovering] = useState(false)
  const { loginWithEmail, error, loading } = useLogin()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await loginWithEmail({ email, password })
  }

  /*
   * Recuperar la contraseña es un desvío DENTRO de esta pantalla, no otra ruta:
   * un paso y se vuelve. El correo tecleado viaja al desvío para no pedirlo
   * dos veces.
   */
  if (recovering) {
    return <ForgotPasswordForm initialEmail={email} onBack={() => setRecovering(false)} />
  }

  return (
    <AuthScreen
      hero={
        <AuthHero
          eyebrow={t('auth.hero.enter')}
          headlineLines={[t('auth.hero.welcome.line1'), t('auth.hero.welcome.line2')]}
          height="tall"
        />
      }
    >
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5">
        <FormField htmlFor="login-email" label={t('auth.email')}>
          <FormInput
            id="login-email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={setEmail}
            disabled={loading}
            autoComplete="email"
            required
          />
        </FormField>

        <FormField
          htmlFor="login-password"
          label={t('auth.password')}
          trailing={
            /* Los 44 px de objetivo táctil con márgenes negativos: el área de
               pulsación crece sin empujar la fila de la etiqueta. */
            <button
              type="button"
              onClick={() => setRecovering(true)}
              disabled={loading}
              className="-my-3 inline-flex min-h-11 items-center text-xs font-semibold text-cobalt underline-offset-4 hover:underline"
            >
              {t('auth.forgotShort')}
            </button>
          }
        >
          <FormInput
            id="login-password"
            type="password"
            value={password}
            onChange={setPassword}
            disabled={loading}
            autoComplete="current-password"
            required
          />
        </FormField>

        <div className="mt-3 flex flex-col gap-4">
          <Button type="submit" className="w-full rounded-action" disabled={loading}>
            {loading ? t('auth.signingIn') : t('auth.signIn')}
          </Button>

          <p className="flex min-h-11 items-center justify-center gap-1.5 text-sm text-ink/55">
            {t('auth.noAccount')}
            {/* El estado viaja con el enlace: es donde va la ruta pretendida,
                y el alta la necesita para rellenar el código del QR. */}
            <Link
              to={{ search: authViewSearch('register') }}
              state={location.state}
              className="font-semibold text-cobalt underline-offset-4 hover:underline"
            >
              {t('auth.register')}
            </Link>
          </p>
        </div>
      </form>
    </AuthScreen>
  )
}
