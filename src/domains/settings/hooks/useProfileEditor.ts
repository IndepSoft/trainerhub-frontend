import { useCallback, useState } from 'react'
import { container } from '@/app/container'
import { AppError } from '@/shared/domain/errors'
import { useViewerContext } from '@/app/ViewerContext'
import { useAuthStore } from '@/app/stores/authStore'

/** Lo que se puede cambiar de uno mismo, sea cual sea la ficha. */
export interface ProfileDraft {
  firstName: string
  lastName: string
  photoUrl: string
}

/** Dónde vive el perfil de quien mira. */
export type ProfileOwner = 'trainer' | 'student' | 'none'

interface UseProfileEditorResult {
  owner: ProfileOwner
  /**
   * La ficha que se está editando. `null` mientras no hay ninguna.
   *
   * Se expone para poder montar el formulario con `key`: al cambiar de persona
   * el borrador tiene que reiniciarse. Con la CLAVE PUESTA EN LOS VALORES —el
   * nombre y los apellidos— guardar remontaba el formulario, porque al guardar
   * cambian: se perdía el acuse de «guardado» y, con más de una edición
   * seguida, se habría perdido lo escrito.
   */
  profileId: string | null
  initial: ProfileDraft
  /**
   * El correo. No se edita: es la llave con la que se entra.
   *
   * Sale de la CUENTA y no de la ficha. Quien todavía no está en ningún equipo
   * no tiene ficha, y aun así tiene correo —entró con él—: leerlo de la ficha
   * dejaba un guion en el sitio del dato de alguien que sí lo tiene.
   */
  email: string
  saving: boolean
  error: string | null
  save: (draft: ProfileDraft) => Promise<boolean>
}

/**
 * Editar el propio perfil.
 *
 * NO HAY ENTIDAD DE PERSONA en esta aplicación, y eso decide cómo funciona
 * esto. `AuthUser` sólo tiene identificador y correo; el nombre y la cara viven
 * en la FICHA que a uno le corresponda: la de entrenador si gestiona, la de
 * alumno si entrena. Así que guardar escribe en una o en otra.
 *
 * QUIEN NO TIENE NINGUNA no puede editar nada, y es un estado legítimo: alguien
 * recién registrado que aún no pertenece a ningún equipo. Se le dice, en vez de
 * ofrecerle un formulario que no guardaría en ninguna parte.
 *
 * EL CORREO NO SE TOCA. Es la llave por la que se reconoce a alguien —es lo que
 * enlaza una cuenta con la ficha que le esperaba— y cambiarlo desde aquí dejaría
 * a la persona fuera de su propio historial. Se enseña, no se edita.
 *
 * TODO: la contraseña tampoco se cambia. `AuthPort` no expone esa operación, y
 * añadirla a medias —un formulario que no llama a nada— sería peor que no
 * ofrecerla.
 */
export function useProfileEditor(): UseProfileEditorResult {
  const { trainer, active } = useViewerContext()
  const user = useAuthStore((state) => state.user)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const student = active?.student ?? null

  /*
   * La de entrenador manda cuando existen las dos. Quien gestiona un equipo y
   * además entrena en él tiene dos fichas, y la que se enseña por ahí —en el
   * menú de usuario, firmando los anuncios del muro— es la de entrenador.
   * Editar una y ver la otra sería desconcertante.
   */
  const owner: ProfileOwner = trainer !== null ? 'trainer' : student !== null ? 'student' : 'none'

  const source = trainer ?? student

  const initial: ProfileDraft = {
    firstName: source?.firstName ?? '',
    lastName: source?.lastName ?? '',
    photoUrl: source?.photoUrl ?? '',
  }

  const save = useCallback(
    async (draft: ProfileDraft): Promise<boolean> => {
      setSaving(true)
      setError(null)

      // Una cadena vacía no es «sin foto»: se guarda como ausencia, que es lo
      // que el resto de la aplicación entiende para caer en las iniciales.
      const photoUrl = draft.photoUrl.trim() === '' ? undefined : draft.photoUrl.trim()

      try {
        if (trainer !== null) {
          await container.trainers.updateProfile(trainer.id, {
            firstName: draft.firstName.trim(),
            lastName: draft.lastName.trim(),
            photoUrl,
            // Se conservan: no están en este formulario, y omitirlos los
            // borraría.
            bio: trainer.bio,
            yearsExperience: trainer.yearsExperience,
          })
          return true
        }

        if (student !== null) {
          await container.students.updateProfile(student.id, {
            firstName: draft.firstName.trim(),
            lastName: draft.lastName.trim(),
            photoUrl,
          })
          return true
        }

        return false
      } catch (caught) {
        setError(AppError.is(caught) ? caught.message : 'No se pudo guardar el perfil')
        return false
      } finally {
        setSaving(false)
      }
    },
    [trainer, student]
  )

  return {
    owner,
    profileId: source?.id ?? null,
    initial,
    email: user?.email ?? '',
    saving,
    error,
    save,
  }
}
