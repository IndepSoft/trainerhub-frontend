import { MailCheck } from 'lucide-react'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { useResendConfirmation } from '../hooks/useResendConfirmation'

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
 * No lleva botón para ir a identificarse: la pestaña «Iniciar sesión» está
 * justo encima y visible. Un botón obligaría a controlar las pestañas desde la
 * página y a pasar el manejador por tres componentes para un gesto que ya está
 * a un toque.
 *
 * SÍ LLEVA «volver a enviar», y una sola vez: era la salida que no existía
 * cuando el correo no llega. Una sola porque el proveedor limita los envíos por
 * hora y el segundo reenvío seguido sólo gasta el cupo.
 */
export function ConfirmEmailNotice({ email }: ConfirmEmailNoticeProps) {
  const { t } = useTranslation()
  const { loading, error, resent, resend } = useResendConfirmation()

  return (
    <>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-cobalt-tint-2">
          <MailCheck aria-hidden="true" className="size-6 text-cobalt" />
        </div>
        <CardTitle className="text-xl font-semibold">{t('register.confirm.title')}</CardTitle>
        <CardDescription>{t('register.confirm.sentTo', { email })}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 px-2 text-center">
        <p className="text-sm text-ink/70">{t('register.confirm.body')}</p>
        <p className="text-xs text-ink/45">{t('register.confirm.spam')}</p>

        {error !== null && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {resent ? (
          <p className="text-sm font-medium text-cobalt">{t('register.confirm.resent')}</p>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => resend(email)}
            disabled={loading}
          >
            {loading ? t('register.confirm.resending') : t('register.confirm.resend')}
          </Button>
        )}
      </CardContent>
    </>
  )
}
