import { Lock, Mail, User } from 'lucide-react'
import { FormField } from './FormField'
import { FormInput } from './FormInput'
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
  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField htmlFor="register-first-name" label="Nombre" required={isRequired('firstName')}>
          <FormInput
            id="register-first-name"
            placeholder="Juan"
            value={formData.firstName}
            onChange={(value) => setField('firstName', value)}
            icon={User}
            required
          />
        </FormField>

        <FormField htmlFor="register-last-name" label="Apellido" required={isRequired('lastName')}>
          <FormInput
            id="register-last-name"
            placeholder="Pérez"
            value={formData.lastName}
            onChange={(value) => setField('lastName', value)}
            required
          />
        </FormField>
      </div>

      <FormField htmlFor="register-email" label="Email" required={isRequired('email')}>
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

      <FormField htmlFor="register-password" label="Contraseña" required={isRequired('password')}>
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
