import { ArrowLeft, QrCode } from 'lucide-react'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { FormField } from './FormField'
import { FormInput } from './FormInput'
import { RegisterFields } from './RegisterFields'
import { useRegisterForm } from '../hooks/useRegisterForm'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface StudentRegisterFormProps {
  onBack: () => void
}

/**
 * Alta de alumno.
 *
 * CUATRO CAMPOS Y UNO OPCIONAL, frente a los siete del entrenador. Ése era el
 * motivo de partir el registro: el formulario único pedía especialidad, años de
 * experiencia y ubicación a quien sólo quiere ver sus entrenamientos, y declarar
 * una profesión que no se tiene es la forma más rápida de que alguien abandone
 * un alta.
 *
 * EL CÓDIGO DEL EQUIPO ES OPCIONAL, y tiene que serlo por los dos caminos:
 * quien viene del QR no lo escribe —vuelve solo a la pantalla de unirse con el
 * código ya puesto— y quien se apunta por su cuenta todavía no lo tiene. Está
 * aquí para el caso de en medio: alguien a quien su entrenador le pasó el código
 * por mensaje.
 */
export function StudentRegisterForm({ onBack }: StudentRegisterFormProps) {
  const { t } = useTranslation()
  const { formData, isValid, loading, error, isRequired, setField, submit } =
    useRegisterForm('student')

  const handleSubmit = (event: React.FormEvent) => {
    // Sin esto el navegador recarga la pagina entera al enviar.
    event.preventDefault()
    void submit()
  }

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-semibold">{t('register.student.title')}</CardTitle>
        <CardDescription>
          {t('register.student.hint')}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-2">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <RegisterFields formData={formData} isRequired={isRequired} setField={setField} />

            <FormField
              htmlFor="register-join-code"
              label={t('register.student.joinCode')}
              required={false}
            >
              <FormInput
                id="register-join-code"
                placeholder="HIER-RO24"
                value={formData.joinCode}
                onChange={(value) => setField('joinCode', value)}
                icon={QrCode}
              />
            </FormField>

            <p className="text-xs text-ink/45">
              {t('register.student.joinCodeHint')}
            </p>

            <Button type="submit" className="mt-6 w-full" disabled={!isValid || loading}>
              {loading ? t('register.creatingAccount') : t('register.createAccount')}
            </Button>

            <Button type="button" variant="ghost" className="w-full gap-2" onClick={onBack}>
              <ArrowLeft className="size-4" />
              {t('register.student.backToTrainer')}
            </Button>
          </div>
        </form>
      </CardContent>
    </>
  )
}
