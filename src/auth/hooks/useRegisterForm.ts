import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { container } from '@/app/container'
import { useAuthStore } from '@/app/stores/authStore'
import { AppError } from '@/shared/domain/errors'

/**
 * Los campos tal y como los recoge el formulario, en castellano.
 *
 * Se traducen a los nombres del dominio al llamar al puerto. Este hook es esa
 * frontera: la vista habla el idioma del usuario y el dominio el suyo.
 */
export interface RegisterFormData {
  nombre: string
  apellido: string
  email: string
  password: string
  especialidad: string
  experiencia: string
  ubicacion: string
}

export type RegisterFormField = keyof RegisterFormData

const EMPTY_FORM: RegisterFormData = {
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  especialidad: '',
  experiencia: '',
  ubicacion: '',
}

/**
 * Campos obligatorios para poder enviar.
 *
 * Como lista, el formulario y la validación no pueden discrepar. Antes sí lo
 * hacían: el input de ubicación estaba marcado `required` en el JSX pero
 * `isFormValid` no lo comprobaba, así que el navegador bloqueaba el envío por un
 * campo que la validación daba por opcional.
 */
const REQUIRED_FIELDS: RegisterFormField[] = [
  'nombre',
  'apellido',
  'email',
  'password',
  'especialidad',
]

interface UseRegisterFormResult {
  formData: RegisterFormData
  isValid: boolean
  isRequired: (field: RegisterFormField) => boolean
  setField: (field: RegisterFormField, value: string) => void
  submit: () => Promise<void>
  /** En curso: el botón se deshabilita para no dar de alta dos veces. */
  loading: boolean
  /** Mensaje ya traducido, listo para pintar. Nunca un error del proveedor. */
  error: string | null
  /**
   * Aviso de que falta confirmar el correo.
   *
   * Separado de `error` porque no es un fallo: la cuenta se creó. Mezclarlos
   * pintaría un alta correcta en rojo, como si algo hubiera ido mal.
   */
  confirmationNotice: string | null
}

/**
 * Estado, validación y alta del formulario de registro.
 *
 * Vivía dentro de `RegisterForm`, que a la vez guardaba el estado, definía las
 * listas de opciones, validaba, gestionaba el envío y pintaba doscientas líneas
 * de JSX. Separarlo deja el componente como presentación y permite probar la
 * validación sin montar el formulario.
 */
export function useRegisterForm(): UseRegisterFormResult {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  const [formData, setFormData] = useState<RegisterFormData>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null)

  const setField = (field: RegisterFormField, value: string) => {
    setFormData((previous) => ({ ...previous, [field]: value }))
  }

  const isRequired = (field: RegisterFormField) => REQUIRED_FIELDS.includes(field)

  const isValid = REQUIRED_FIELDS.every(
    (field) => formData[field].trim().length > 0
  )

  const submit = async () => {
    setError(null)
    setConfirmationNotice(null)
    setLoading(true)

    try {
      const result = await container.auth.signUp({
        email: formData.email,
        password: formData.password,
        firstName: formData.nombre,
        lastName: formData.apellido,
        specialty: formData.especialidad,
        yearsOfExperience: formData.experiencia,
        location: formData.ubicacion,
        // Este formulario es el alta de ENTRENADOR: pide especialidad y años de
        // experiencia. Cuando exista el alta de alumno sera otro formulario con
        // su propia intencion.
        intent: 'trainer',
      })

      if (result.needsEmailConfirmation) {
        /*
         * La cuenta existe pero no hay sesión. No se navega: llevar a una
         * pantalla protegida sólo conseguiría que `ProtectedRoute` devolviera al
         * usuario aquí, y parecería que el alta ha fallado cuando no ha fallado.
         */
        setConfirmationNotice(
          `Te hemos enviado un correo a ${formData.email}. Confírmalo para entrar.`
        )
        return
      }

      if (result.user) setUser(result.user)
      navigate('/dashboard', { replace: true })
    } catch (caughtError) {
      setError(
        AppError.is(caughtError)
          ? caughtError.message
          : 'No se pudo crear la cuenta. Inténtalo de nuevo.'
      )
    } finally {
      setLoading(false)
    }
  }

  return {
    formData,
    isValid,
    isRequired,
    setField,
    submit,
    loading,
    error,
    confirmationNotice,
  }
}
