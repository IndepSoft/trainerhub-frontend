import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { container } from '@/app/container'
import { useAuthStore } from '@/app/stores/authStore'
import { AppError } from '@/shared/domain/errors'
import type { RegisterFormData, RegisterFormField } from '../types/register.types'

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

const messageFor = (error: unknown) =>
  AppError.is(error) ? error.message : 'No se pudo crear la cuenta'

interface UseRegisterFormResult {
  formData: RegisterFormData
  isValid: boolean
  loading: boolean
  error: string | null
  isRequired: (field: RegisterFormField) => boolean
  setField: (field: RegisterFormField, value: string) => void
  submit: () => Promise<void>
}

/**
 * Estado, validación y envío del formulario de registro.
 *
 * Vivía dentro de `RegisterForm`, que a la vez guardaba el estado, validaba,
 * gestionaba el envío y pintaba doscientas líneas de JSX. Separarlo deja el
 * componente como presentación pura y permite probar la validación sin montar
 * el formulario.
 *
 * QUIÉN ERES LO DECIDE TU CORREO, no una casilla del formulario. Si el correo ya
 * tiene ficha de alumno —porque un entrenador lo dio de alta—, la cuenta se ata
 * a esa ficha y entras como alumno. Si no, se crea una ficha de entrenador.
 *
 * El rol NO se guarda en la cuenta. Se deduce de qué repositorio conoce tu
 * perfil, que es la decisión registrada en CAMBIOS §5: lo que el propio cliente
 * puede editar —`user_metadata`— no sirve para decidir permisos.
 *
 * ORDEN IMPORTANTE: primero la cuenta, después el perfil. Al revés quedarían
 * fichas huérfanas cada vez que el alta de la cuenta fallase, que es el caso
 * frecuente: correo repetido, contraseña corta.
 *
 * TODO: el perfil lo crea el cliente porque no hay backend. Cuando lo haya, el
 * alta entera va en una transacción del servidor: aquí, si la cuenta se crea y
 * el perfil falla, queda una cuenta sin ficha y el siguiente intento choca con
 * «ya existe ese correo».
 */
export function useRegisterForm(): UseRegisterFormResult {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  const [formData, setFormData] = useState<RegisterFormData>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setField = (field: RegisterFormField, value: string) => {
    setFormData((previous) => ({ ...previous, [field]: value }))
    // El error se borra al escribir: dejarlo puesto mientras se corrige lo que
    // lo provocó hace pensar que sigue fallando.
    setError(null)
  }

  const isRequired = (field: RegisterFormField) => REQUIRED_FIELDS.includes(field)

  const isValid = REQUIRED_FIELDS.every((field) => formData[field].trim().length > 0)

  const submit = async () => {
    if (!isValid || loading) return

    setError(null)
    setLoading(true)

    const email = formData.email.trim()

    try {
      const user = await container.auth.signUp({ email, password: formData.password })
      const invited = await container.students.findByEmail(email)

      if (invited === null) {
        await container.trainers.create({
          profileId: user.id,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email,
          // La experiencia es opcional y llega como texto: en blanco se queda
          // sin poner, no en cero, que afirmaría algo que nadie ha dicho.
          yearsExperience: Number.parseInt(formData.yearsOfExperience, 10) || undefined,
        })
      } else {
        await container.students.linkAccount(invited.id, user.id)
      }

      setUser(user)
      navigate('/dashboard', { replace: true })
    } catch (caught) {
      setError(messageFor(caught))
    } finally {
      setLoading(false)
    }
  }

  return { formData, isValid, loading, error, isRequired, setField, submit }
}
