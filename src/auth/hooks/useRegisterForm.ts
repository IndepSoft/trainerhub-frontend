import { useState } from 'react'
import type {
  RegisterFormData,
  RegisterFormField,
} from '../types/register.types'

const EMPTY_FORM: RegisterFormData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  specialty: '',
  yearsOfExperience: '',
  location: '',
}

/**
 * Campos obligatorios para poder enviar.
 *
 * Como lista, el formulario y la validación no pueden discrepar. Antes sí lo
 * hacían: el input de ubicación estaba marcado `required` en el JSX pero
 * `isFormValid` no lo comprobaba, así que el navegador bloqueaba el envío por un
 * campo que la validación consideraba opcional.
 */
const REQUIRED_FIELDS: RegisterFormField[] = [
  'firstName',
  'lastName',
  'email',
  'password',
  'specialty',
]

interface UseRegisterFormResult {
  formData: RegisterFormData
  isValid: boolean
  isRequired: (field: RegisterFormField) => boolean
  setField: (field: RegisterFormField, value: string) => void
  submit: () => void
}

/**
 * Estado y validación del formulario de registro.
 *
 * Vivía dentro de `RegisterForm`, que a la vez guardaba el estado, validaba,
 * gestionaba el envío y pintaba doscientas líneas de JSX. Separarlo deja el
 * componente como presentación pura y permite probar la validación sin montar
 * el formulario.
 */
export function useRegisterForm(): UseRegisterFormResult {
  const [formData, setFormData] = useState<RegisterFormData>(EMPTY_FORM)

  const setField = (field: RegisterFormField, value: string) => {
    setFormData((previous) => ({ ...previous, [field]: value }))
  }

  const isRequired = (field: RegisterFormField) =>
    REQUIRED_FIELDS.includes(field)

  const isValid = REQUIRED_FIELDS.every(
    (field) => formData[field].trim().length > 0
  )

  const submit = () => {
    // TODO: el registro no está implementado. `AuthPort` sólo expone
    // signInWithEmail, signInWithGoogle, signOut, getCurrentUser y
    // onAuthStateChange; falta añadir `signUp` al puerto y a sus adaptadores.
    // Hasta entonces el botón "Crear cuenta" no da de alta a nadie.
    console.log('Registro pendiente de implementar:', formData)
  }

  return { formData, isValid, isRequired, setField, submit }
}
