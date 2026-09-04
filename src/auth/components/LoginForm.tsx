import { useState } from 'react'
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Chrome } from 'lucide-react'
import { useLogin } from '../hooks/useLogin'
import { useTranslation } from '@/shared/i18n/LanguageContext'

export function LoginForm() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { loginWithEmail, loginWithGoogle, error, loading } = useLogin()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    await loginWithEmail({ email, password })
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
              {/*
                TODO: la recuperacion de contraseña no esta implementada. El
                boton llevaba un console.log como manejador, que habria acabado
                en produccion. Requiere resetPasswordForEmail en AuthPort.
              */}
              <Button
                type="button"
                variant="link"
                size="sm"
                className="px-0 font-normal"
                disabled
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

      <CardFooter className="flex flex-col gap-4">
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {t('auth.orContinueWith')}
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={loginWithGoogle}
          disabled={loading}
        >
          <Chrome className="mr-2 h-4 w-4" />
          {t('auth.continueWithGoogle')}
        </Button>
      </CardFooter>
    </>
  )
}
