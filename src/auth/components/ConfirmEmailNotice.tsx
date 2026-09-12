import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { useResendConfirmation } from '../hooks/useResendConfirmation'
import { authViewSearch } from '../libs/authView'
import { AuthHero } from './AuthHero'
import { AuthScreen } from './AuthScreen'

interface ConfirmEmailNoticeProps {
  /** La dirección a la que ha ido el enlace. Se enseña para poder detectar un error al teclearla. */
  email: string
}

/**
 * El final del alta cuando el proveedor exige confirmar el correo.
 *
 * HACÍA FALTA Y NO EXISTÍA. El registro llamaba a `setUser` y navegaba al panel
 * en cuanto la cuenta se creaba, pero con la confirmación activada la cuenta
 * existe y la sesión NO: la aplicación parecía tener a alguien dentro, y a la
 * primera recarga `getCurrentUser` devolvía null y le echaba sin explicar nada.
 *
 * NO ES UN ERROR Y NO SE PINTA COMO TAL. La cuenta se ha creado, que es lo que
 * se pedía; falta un paso que está en otra pantalla. Un aviso rojo aquí haría
 * pensar que hay que volver a intentarlo, y volver a intentarlo choca con «ya
 * existe una cuenta con ese correo».
 *
 * SE ENSEÑA LA DIRECCIÓN, y no por cortesía: el error corriente de esta pantalla
 * es haber tecleado mal el correo, y es la única forma de que quien espera un
 * mensaje que no llega pueda darse cuenta.
 *
 * LLEVA ENLACE A IDENTIFICARSE, porque ya no hay pestañas a la vista: la
 * pantalla anterior tenía «Iniciar sesión» a un toque y ésta lo sustituye
 * entera, así que sin el enlace quien ya confirmó no tendría por dónde entrar.
 *
 * SÍ LLEVA «volver a enviar», y una sola vez: era la salida que no existía
 * cuando el correo no llega. Una sola porque el proveedor limita los envíos por
 * hora y el segundo reenvío seguido sólo gasta el cupo.
 */
export function ConfirmEmailNotice({ email }: ConfirmEmailNoticeProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const { loading, error, resent, resend } = useResendConfirmation()

  return (
    <AuthScreen
      hero={
        <AuthHero
          eyebrow={t('register.createAccount')}
          headlineLines={[t('register.confirm.line1'), t('register.confirm.line2')]}
          height="short"
        />
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm leading-relaxed text-ink/70">
          {t('register.confirm.sentTo', { email })}
        </p>
        <p className="text-sm leading-relaxed text-ink/70">{t('register.confirm.body')}</p>
        <p className="text-xs leading-relaxed text-ink/45">{t('register.confirm.spam')}</p>
      </div>

      {error !== null && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mt-auto flex flex-col gap-3 pt-3">
        {resent ? (
          <p className="flex min-h-11 items-center justify-center text-sm font-semibold text-cobalt">
            {t('register.confirm.resent')}
          </p>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-action"
            onClick={() => resend(email)}
            disabled={loading}
          >
            {loading ? t('register.confirm.resending') : t('register.confirm.resend')}
          </Button>
        )}
        <p className="flex min-h-11 items-center justify-center gap-1.5 text-sm text-ink/55">
          {t('auth.haveAccount')}
          <Link
            to={{ search: authViewSearch('login') }}
            state={location.state}
            className="font-semibold text-cobalt underline-offset-4 hover:underline"
          >
            {t('auth.signIn')}
          </Link>
        </p>
      </div>
    </AuthScreen>
  )
}
