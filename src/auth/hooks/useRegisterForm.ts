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

export type RegisterStep = 1 | 2

export const TOTAL_STEPS = 2

/**
 * Qué campo pertenece a cada paso.
 *
 * El formulario se parte en dos porque en un móvil de 375 px los siete campos
 * ocupaban 1,29 pantallas —y eso ANTES de que el teclado tape la mitad—. Partido
 * así, cada paso entra de una vez y el botón de avanzar queda siempre visible.
 *
 * El corte no es por cantidad, es por significado: primero quién eres y cómo
 * entras; después a qué te dedicas. Son dos preguntas distintas y se responden
 * con cabezas distintas.
 *
 * IMPORTANTE: esta tabla y los bloques del JSX de `RegisterForm` describen el
 * mismo reparto. Si se mueve un campo de paso, hay que moverlo en los dos
 * sitios, o `canAdvance` exigiría un campo que no está en pantalla.
 */
const STEP_FIELDS: Record<RegisterStep, RegisterFormField[]> = {
  1: ['nombre', 'apellido', 'email', 'password'],
  2: ['especialidad', 'experiencia', 'ubicacion'],
}

export const STEP_TITLES: Record<RegisterStep, string> = {
  1: 'Tus datos de acceso',
  2: 'Tu perfil profesional',
}

interface UseRegisterFormResult {
  formData: RegisterFormData
  isValid: boolean
  isRequired: (field: RegisterFormField) => boolean
  setField: (field: RegisterFormField, value: string) => void
  submit: () => Promise<void>
  /** Paso visible ahora. */
  step: RegisterStep
  /** Si los obligatorios del paso actual están completos. */
  canAdvance: boolean
  goNext: () => void
  goBack: () => void
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
  const [step, setStep] = useState<RegisterStep>(1)
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

  /*
   * Solo mira los OBLIGATORIOS de este paso. El segundo trae dos campos
   * opcionales, y exigirlos para avanzar convertiria en obligatorio algo que la
   * validacion final da por opcional: la misma incoherencia que ya tenia
   * `ubicacion`, en otro sitio.
   */
  const canAdvance = STEP_FIELDS[step]
    .filter((field) => REQUIRED_FIELDS.includes(field))
    .every((field) => formData[field].trim().length > 0)

  const goNext = () => {
    // El error del paso anterior no debe seguir en pantalla al cambiar de paso:
    // se refiere a algo que ya no se ve.
    setError(null)
    setStep((current) => (current < TOTAL_STEPS ? ((current + 1) as RegisterStep) : current))
  }

  const goBack = () => {
    setError(null)
    setStep((current) => (current > 1 ? ((current - 1) as RegisterStep) : current))
  }

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
    step,
    canAdvance,
    goNext,
    goBack,
    loading,
    error,
    confirmationNotice,
  }
}
