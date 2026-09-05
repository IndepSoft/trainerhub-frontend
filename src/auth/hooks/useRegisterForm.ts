import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { container } from '@/app/container'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { useAuthStore } from '@/app/stores/authStore'
import { AppError } from '@/shared/domain/errors'
import { canEnrollMembers } from '@/shared/domain/entities/crew'
import { readIntendedPath } from '../libs/intendedPath'
import type {
  RegisterFormData,
  RegisterFormField,
  RegisterIntent,
} from '../types/register.types'

const EMPTY_FORM: RegisterFormData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  specialty: '',
  yearsOfExperience: '',
  location: '',
  joinCode: '',
}

/**
 * Qué es obligatorio, según con qué intención se registra.
 *
 * Como lista, el formulario y la validación no pueden discrepar. Antes sí lo
 * hacían: el input de ubicación estaba marcado `required` en el JSX pero
 * `isFormValid` no lo comprobaba, así que el navegador bloqueaba el envío por un
 * campo que la validación consideraba opcional.
 *
 * El alumno no da especialidad ni años de experiencia. Pedírselos era el motivo
 * de partir el registro en dos: un formulario que interroga sobre una profesión
 * a quien sólo quiere ver sus entrenamientos.
 */
const REQUIRED_BY_INTENT: Record<RegisterIntent, RegisterFormField[]> = {
  trainer: ['firstName', 'lastName', 'email', 'password', 'specialty'],
  student: ['firstName', 'lastName', 'email', 'password'],
}

/* El mensaje de reserva llega de fuera. Ver `useLogin` para el porque. */
const messageFor = (error: unknown, fallback: string) =>
  AppError.is(error) ? error.message : fallback

interface UseRegisterFormResult {
  formData: RegisterFormData
  isValid: boolean
  loading: boolean
  error: string | null
  /**
   * La cuenta se creó pero no hay sesión: falta confirmar el correo.
   *
   * No es un error y no se cuenta como tal. Es el final normal del alta cuando
   * el proveedor exige confirmación, y quien lo recibe tiene que ver qué hacer
   * a continuación, no un aviso rojo.
   */
  awaitingConfirmation: boolean
  isRequired: (field: RegisterFormField) => boolean
  setField: (field: RegisterFormField, value: string) => void
  submit: () => Promise<void>
}

/**
 * Estado, validación y envío del registro.
 *
 * Vivía dentro de `RegisterForm`, que a la vez guardaba el estado, validaba,
 * gestionaba el envío y pintaba doscientas líneas de JSX. Separarlo deja el
 * componente como presentación pura y permite probar la validación sin montar
 * el formulario.
 *
 * RECIBE LA INTENCIÓN, y de ella dependen tres cosas: qué campos se exigen, qué
 * perfil se crea y a dónde se aterriza. Lo que NO depende de ella es el rol
 * real: eso se sigue deduciendo de quién te conoce.
 *
 * QUIEN YA ERA ALUMNO DE ALGUIEN LO SIGUE SIENDO, se registre como se registre.
 * `claimByEmail` corre en los dos casos: si un entrenador ya había creado tu
 * ficha con este correo, entras a su equipo aunque además vengas a montar el
 * tuyo. Las dos cosas pueden ser ciertas a la vez, y el rol es por crew.
 *
 * LA CUENTA Y SU FICHA NACEN JUNTAS, y ya no las crea este hook por separado.
 * El perfil viaja dentro del alta y lo escribe el proveedor —en Supabase, un
 * disparador sobre `auth.users`, dentro de la misma transacción—. Antes se
 * creaba aquí, después, y quedaba anotado el hueco: si la cuenta se creaba y la
 * ficha fallaba, quedaba una cuenta sin ficha y el siguiente intento chocaba con
 * «ya existe ese correo». Ese hueco ya no existe.
 *
 * Y NO SE DA POR IDENTIFICADO A NADIE SIN COMPROBARLO. Con la confirmación por
 * correo activada —que es como está el proyecto real— el alta crea la cuenta y
 * NO abre sesión. Antes se llamaba a `setUser` igualmente y se navegaba al
 * panel: la aplicación parecía tener a alguien dentro, y a la primera recarga
 * `getCurrentUser` devolvía null y le echaba. Ahora se pregunta.
 */
export function useRegisterForm(intent: RegisterIntent): UseRegisterFormResult {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const setUser = useAuthStore((state) => state.setUser)
  const [formData, setFormData] = useState<RegisterFormData>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  const required = REQUIRED_BY_INTENT[intent]

  const setField = (field: RegisterFormField, value: string) => {
    setFormData((previous) => ({ ...previous, [field]: value }))
    // El error se borra al escribir: dejarlo puesto mientras se corrige lo que
    // lo provocó hace pensar que sigue fallando.
    setError(null)
  }

  const isRequired = (field: RegisterFormField) => required.includes(field)

  const isValid = required.every((field) => formData[field].trim().length > 0)

  const submit = async () => {
    if (!isValid || loading) return

    setError(null)
    setLoading(true)

    const email = formData.email.trim()

    /*
     * Lo que no le toca al rol elegido no se manda.
     *
     * El borrador es uno solo para los dos formularios, asi que un alumno lleva
     * los campos del entrenador en blanco. Mandarlos guardaria una especialidad
     * vacia, que no es lo mismo que no tenerla.
     */
    const trainerOnly = (value: string): string | undefined =>
      intent === 'trainer' ? optionalField(value) : undefined

    try {
      const user = await container.auth.signUp({
        email,
        password: formData.password,
        profile: {
          intent,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          specialty: trainerOnly(formData.specialty),
          yearsOfExperience: trainerOnly(formData.yearsOfExperience),
          location: trainerOnly(formData.location),
        },
      })

      /*
       * ¿HAY SESIÓN DE VERDAD? El puerto lo deja escrito: devolver el usuario no
       * significa que ya esté dentro. Con la confirmación por correo activada la
       * cuenta existe y la sesión no, y todo lo que viene detrás —reclamar
       * fichas, entrar a un equipo, navegar— necesita estar dentro.
       */
      const session = await container.auth.getCurrentUser()

      if (session === null) {
        setAwaitingConfirmation(true)
        return
      }

      // Las fichas que esperaban este correo, en CUALQUIER equipo. Corre para
      // los dos roles: un entrenador puede ser además alumno de otro.
      await container.students.claimByEmail(email, user.id)

      if (intent === 'student' && formData.joinCode.trim() !== '') {
        await joinWithCode(formData.joinCode, user.id, email)
      }

      setUser(user)
      // A donde se quería ir —el QR desvía aquí y hay que volver— y si no a la
      // raíz, que es donde `HomeRedirect` decide según el papel.
      navigate(readIntendedPath(location.state) ?? '/', { replace: true })
    } catch (caught) {
      setError(messageFor(caught, t('register.error')))
    } finally {
      setLoading(false)
    }
  }

  return { formData, isValid, loading, error, awaitingConfirmation, isRequired, setField, submit }
}

/** Lo escrito, o nada. Una cadena en blanco no es un dato: es un campo vacío. */
function optionalField(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

/**
 * Entra al equipo cuyo código se ha escrito en el alta.
 *
 * UN CÓDIGO QUE NO VALE NO TUMBA EL REGISTRO. La cuenta ya está creada y es lo
 * importante; equivocarse al copiar ocho caracteres no puede costar volver a
 * empezar. Se ignora en silencio y quien lo escribió lo reintenta desde la
 * pantalla de unirse, que es donde el error sí se explica.
 */
async function joinWithCode(code: string, profileId: string, email: string): Promise<void> {
  const crew = await container.crews.findByJoinToken(code)
  if (crew === null || !canEnrollMembers(crew)) return

  await container.students.claimMembership({
    crewId: crew.id,
    profileId,
    email,
    status: crew.requiresApproval ? 'pending' : 'active',
  })
}
