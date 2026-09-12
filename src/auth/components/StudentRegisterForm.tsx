import type { FormEvent } from 'react'
import { Button } from '@/shared/ui/button'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { useRegisterForm } from '../hooks/useRegisterForm'
import { AuthHero } from './AuthHero'
import { AuthScreen } from './AuthScreen'
import { ConfirmEmailNotice } from './ConfirmEmailNotice'
import { FormField } from './FormField'
import { FormInput } from './FormInput'
import { RegisterFields } from './RegisterFields'

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
 * un alta. Por eso cabe en un paso, y el de entrenador en dos.
 *
 * EL CÓDIGO DEL EQUIPO ES OPCIONAL, y tiene que serlo por los dos caminos:
 * quien viene del QR no lo escribe —vuelve solo a la pantalla de unirse con el
 * código ya puesto— y quien se apunta por su cuenta todavía no lo tiene. Está
 * aquí para el caso de en medio: alguien a quien su entrenador le pasó el código
 * por mensaje. Se escribe en Condensed y mayúsculas, como se lee en el QR.
 */
export function StudentRegisterForm({ onBack }: StudentRegisterFormProps) {
  const { t } = useTranslation()
  const { formData, isValid, loading, error, awaitingConfirmation, isRequired, setField, submit } =
    useRegisterForm('student')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    // Sin esto el navegador recarga la pagina entera al enviar.
    event.preventDefault()
    void submit()
  }

  // Mismo motivo que en el alta de entrenador: se sustituye, no se superpone.
  if (awaitingConfirmation) return <ConfirmEmailNotice email={formData.email.trim()} />

  return (
    <AuthScreen
      hero={
        <AuthHero
          eyebrow={t('register.student.eyebrow')}
          headlineLines={[t('register.student.line1'), t('register.student.line2')]}
          height="short"
          back={{ label: t('register.student.backToTrainer'), onClick: onBack }}
        />
      }
    >
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5">
        <RegisterFields
          formData={formData}
          isRequired={isRequired}
          setField={setField}
          disabled={loading}
        />

        <FormField
          htmlFor="register-join-code"
          label={t('register.student.joinCode')}
          optional
          hint={t('register.student.joinCodeHint')}
        >
          <FormInput
            id="register-join-code"
            placeholder="HIER-RO24"
            value={formData.joinCode}
            onChange={(value) => setField('joinCode', value)}
            autoComplete="off"
            disabled={loading}
            emphasized
          />
        </FormField>

        <div className="mt-auto flex flex-col gap-3 pt-3">
          <Button type="submit" className="w-full rounded-action" disabled={!isValid || loading}>
            {loading ? t('register.creatingAccount') : t('register.createAccount')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full rounded-action text-ink/55"
            onClick={onBack}
          >
            {t('register.student.backToTrainer')}
          </Button>
        </div>
      </form>
    </AuthScreen>
  )
}
