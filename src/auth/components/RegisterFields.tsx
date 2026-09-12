import { FormField } from './FormField'
import { FormInput } from './FormInput'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import type { RegisterFormData, RegisterFormField } from '../types/register.types'

interface RegisterFieldsProps {
  formData: RegisterFormData
  isRequired: (field: RegisterFormField) => boolean
  setField: (field: RegisterFormField, value: string) => void
  disabled?: boolean
}

/**
 * Los campos que piden los dos registros: quién eres y cómo entras.
 *
 * Se extraen porque son idénticos en las dos altas, y duplicarlos garantizaba
 * que se separasen: el día que cambie el marcador de obligatorio o el tipo del
 * campo de correo, habría que acordarse de hacerlo dos veces.
 *
 * Lo que NO está aquí es lo propio de cada rol —especialidad y experiencia por
 * un lado, código del equipo por otro—: eso es justo lo que distingue a los dos
 * formularios, y meterlo detrás de condiciones los volvería a fundir en uno.
 *
 * Nombre y apellido comparten fila a partir de `sm`, nunca en móvil: es la
 * regla de rejillas de §1.6, sin excepciones. La propuesta los ponía juntos a
 * 375 px; se respeta la regla y el alta desplaza un campo en un teléfono bajo,
 * que es lo correcto, no un recorte.
 */
export function RegisterFields({
  formData,
  isRequired,
  setField,
  disabled = false,
}: RegisterFieldsProps) {
  const { t } = useTranslation()

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
        <FormField
          htmlFor="register-first-name"
          label={t('register.firstName')}
          optional={!isRequired('firstName')}
        >
          <FormInput
            id="register-first-name"
            placeholder={t('register.firstNamePlaceholder')}
            value={formData.firstName}
            onChange={(value) => setField('firstName', value)}
            autoComplete="given-name"
            disabled={disabled}
            required
          />
        </FormField>

        <FormField
          htmlFor="register-last-name"
          label={t('register.lastName')}
          optional={!isRequired('lastName')}
        >
          <FormInput
            id="register-last-name"
            placeholder={t('register.lastNamePlaceholder')}
            value={formData.lastName}
            onChange={(value) => setField('lastName', value)}
            autoComplete="family-name"
            disabled={disabled}
            required
          />
        </FormField>
      </div>

      <FormField htmlFor="register-email" label={t('auth.email')} optional={!isRequired('email')}>
        <FormInput
          id="register-email"
          type="email"
          placeholder="tu@email.com"
          value={formData.email}
          onChange={(value) => setField('email', value)}
          autoComplete="email"
          disabled={disabled}
          required
        />
      </FormField>

      <FormField
        htmlFor="register-password"
        label={t('auth.password')}
        optional={!isRequired('password')}
      >
        <FormInput
          id="register-password"
          type="password"
          placeholder={t('auth.passwordPlaceholder')}
          value={formData.password}
          onChange={(value) => setField('password', value)}
          autoComplete="new-password"
          disabled={disabled}
          required
        />
      </FormField>
    </>
  )
}
