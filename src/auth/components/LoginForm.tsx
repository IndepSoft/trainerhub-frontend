import { useState } from 'react'
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { useLogin } from '../hooks/useLogin'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { ForgotPasswordForm } from './ForgotPasswordForm'

export function LoginForm() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [recovering, setRecovering] = useState(false)
  const { loginWithEmail, error, loading } = useLogin()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    await loginWithEmail({ email, password })
  }

  /*
   * Recuperar la contraseña es un desvío DENTRO de esta pestaña, no otra ruta:
   * un paso y se vuelve. El correo tecleado viaja al desvío para no pedirlo
   * dos veces.
   */
  if (recovering) {
    return <ForgotPasswordForm initialEmail={email} onBack={() => setRecovering(false)} />
  }

  return (
    <>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold text-center">
          {t('auth.welcomeBack')}
        </CardTitle>
        <CardDescription className="text-center">
          {t('auth.welcomeBackHint')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">{t('auth.email')}</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">{t('auth.password')}</Label>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="px-0 font-normal"
                onClick={() => setRecovering(true)}
                disabled={loading}
              >
                {t('auth.forgotPassword')}
              </Button>
            </div>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
              required
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('auth.signingIn') : t('auth.signIn')}
          </Button>
        </form>
      </CardContent>
    </>
  )
}
