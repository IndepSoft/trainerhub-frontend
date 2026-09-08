import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { useAuthStore } from '@/app/stores/authStore'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { PasswordFields } from '../components/PasswordFields'

/**
 * A donde vuelve el enlace del correo de recuperación.
 *
 * NO ES RUTA DE INVITADO NI PROTEGIDA, y no por descuido. El enlace trae la
 * sesión consigo —el proveedor la abre al leer el fragmento de la dirección—,
 * así que la guardia de invitado la echaría a la raíz antes de poder cambiar
 * nada; y protegerla tampoco vale, porque quien llega con el enlace caducado
 * no tiene sesión y se merece saber por qué, no un formulario de acceso sin
 * explicación.
 *
 * Sin sesión, por tanto, se dice que el enlace no vale y se manda a pedir
 * otro. Con ella, se cambia la contraseña y se entra: la sesión ya está
 * abierta, y obligar a teclear la contraseña recién puesta sería un paso de
 * más.
 */
export default function NewPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)

  const body =
    loading ? null : user === null ? (
      <CardContent className="space-y-4 text-center">
        <p className="text-sm text-ink/70">{t('auth.newPassword.expired')}</p>
        <Button asChild variant="outline" className="w-full">
          <Link to="/authentication">{t('auth.reset.back')}</Link>
        </Button>
      </CardContent>
    ) : (
      <CardContent>
        <PasswordFields idPrefix="recovery" onSaved={() => navigate('/', { replace: true })} />
      </CardContent>
    )

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-lg p-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold text-center">
              {t('auth.newPassword.title')}
            </CardTitle>
            <CardDescription className="text-center">{t('auth.newPassword.hint')}</CardDescription>
          </CardHeader>
          {body}
        </Card>
      </div>
    </div>
  )
}
