import type { TrainerProfile, TrainerRepository } from '@/shared/domain/ports/TrainerRepository'
import type { Trainer } from '@/shared/domain/entities/trainer'
import { AppErrorCode } from '@/shared/domain/errors'
import { supabase } from './client'
import { mapDataError } from './errorMapper'
import { toProfileUpdate, toTrainer, type ProfileRow } from './mappers'
import { subscribeToTable } from './realtime'

/**
 * Los roles de `profiles` que tienen ficha de entrenador.
 *
 * `admin` esta dentro para que quien administra la plataforma no se quede sin
 * nombre en el menu de usuario: la ficha es de donde salen sus iniciales. No le
 * concede nada mas -administrar la plataforma se decide contra
 * `platform_admin_emails`, no aqui-.
 */
const TRAINER_ROLES = ['trainer', 'admin']

/**
 * Implementacion de TrainerRepository sobre PostgREST.
 *
 * VA CONTRA `profiles`, NO CONTRA `trainers`. Apuntaba a una tabla `trainers`
 * que no existe en esta base, asi que cada carga del panel pedia
 * `/rest/v1/trainers` y recibia un 404; lo que la aplicacion llama «la ficha del
 * entrenador» es en este esquema la fila de `profiles`, uno a uno con la cuenta.
 *
 * YA NO CREA NADA, y ese metodo desaparecio del puerto con el. La fila nace en
 * el mismo acto que la cuenta, dentro de un disparador de Postgres: es la unica
 * forma de que exista cuando la confirmacion por correo esta activada -sin
 * sesion, RLS rechaza cualquier escritura del cliente- y de paso cierra el hueco
 * que el registro tenia anotado, el de la cuenta creada cuya ficha falla.
 */
export class SupabaseTrainerRepository implements TrainerRepository {
  async findByProfileId(profileId: string): Promise<Trainer | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      // La clave de `profiles` ES el identificador de la cuenta. Ver `toTrainer`.
      .eq('id', profileId)
      .maybeSingle()

    if (error) {
      const appError = mapDataError(error)
      // "no encontrado" no es un fallo: es una respuesta valida del dominio.
      if (appError.code === AppErrorCode.NOT_FOUND) return null
      throw appError
    }

    if (data === null) return null

    const row = data as ProfileRow
    /*
     * Un alumno tiene perfil y NO tiene ficha de entrenador.
     *
     * Distinguirlo aqui importa mas de lo que parece: `HomeRedirect` manda a
     * crear equipo a quien tiene ficha y no pertenece a ninguno, asi que
     * devolver la fila de cualquiera pondria a los alumnos recien registrados a
     * fundar un equipo que no han pedido.
     */
    return TRAINER_ROLES.includes(row.role) ? toTrainer(row) : null
  }

  async updateProfile(trainerId: string, data: TrainerProfile): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update(toProfileUpdate(data))
      .eq('id', trainerId)

    if (error) throw mapDataError(error)
  }

  /**
   * Sobre `profiles`, que es donde vive la ficha del entrenador.
   *
   * `useViewer` lo necesita en el arranque: al registrarse, la fila nace por
   * disparador DESPUES de que la sesion se haya resuelto, asi que sin este
   * aviso el recien registrado se quedaba sin rol hasta recargar.
   */
  onChange(listener: () => void): () => void {
    return subscribeToTable('profiles', listener)
  }
}
