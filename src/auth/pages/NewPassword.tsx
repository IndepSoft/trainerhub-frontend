import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { useAuthStore } from '@/app/stores/authStore'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { AuthHero } from '../components/AuthHero'
import { AuthScreen } from '../components/AuthScreen'
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
 *
 * Los campos son los mismos que en Configuración —`PasswordFields`— y llevan
 * la caja de allí, no la línea del alta: un formulario que aparece en dos
 * sitios se ve igual en los dos.
 */
export default function NewPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-bone">
      <AuthScreen
        hero={
          <AuthHero
            eyebrow={t('auth.hero.enter')}
            headlineLines={[t('auth.hero.newPassword.line1'), t('auth.hero.newPassword.line2')]}
            height="short"
          />
        }
      >
        <p className="text-sm leading-relaxed text-ink/55">{t('auth.newPassword.hint')}</p>

        {loading ? null : user === null ? (
          <div className="flex flex-1 flex-col gap-5">
            <p className="text-sm leading-relaxed text-ink/70">{t('auth.newPassword.expired')}</p>
            <div className="mt-auto pt-3">
              <Button asChild className="w-full rounded-action">
                <Link to="/authentication">{t('auth.reset.back')}</Link>
              </Button>
            </div>
          </div>
        ) : (
          <PasswordFields idPrefix="recovery" onSaved={() => navigate('/', { replace: true })} />
        )}
      </AuthScreen>
    </div>
  )
}
