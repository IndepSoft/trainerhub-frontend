import { Lock, Mail, User } from 'lucide-react'
import { FormField } from './FormField'
import { FormInput } from './FormInput'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import type { RegisterFormData, RegisterFormField } from '../types/register.types'

interface RegisterFieldsProps {
  formData: RegisterFormData
  isRequired: (field: RegisterFormField) => boolean
  setField: (field: RegisterFormField, value: string) => void
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
 */
export function RegisterFields({ formData, isRequired, setField }: RegisterFieldsProps) {
  const { t } = useTranslation()

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          htmlFor="register-first-name"
          label={t('register.firstName')}
          required={isRequired('firstName')}
        >
          <FormInput
            id="register-first-name"
            placeholder={t('register.firstNamePlaceholder')}
            value={formData.firstName}
            onChange={(value) => setField('firstName', value)}
            icon={User}
            required
          />
        </FormField>

        <FormField
          htmlFor="register-last-name"
          label={t('register.lastName')}
          required={isRequired('lastName')}
        >
          <FormInput
            id="register-last-name"
            placeholder={t('register.lastNamePlaceholder')}
            value={formData.lastName}
            onChange={(value) => setField('lastName', value)}
            required
          />
        </FormField>
      </div>

      <FormField htmlFor="register-email" label={t('auth.email')} required={isRequired('email')}>
        <FormInput
          id="register-email"
          type="email"
          placeholder="tu@email.com"
          value={formData.email}
          onChange={(value) => setField('email', value)}
          icon={Mail}
          required
        />
      </FormField>

      <FormField
        htmlFor="register-password"
        label={t('auth.password')}
        required={isRequired('password')}
      >
        <FormInput
          id="register-password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={(value) => setField('password', value)}
          icon={Lock}
          required
        />
      </FormField>
    </>
  )
}
