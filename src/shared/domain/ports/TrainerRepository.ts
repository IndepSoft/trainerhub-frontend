import type { Trainer } from '../entities/trainer'

/**
 * Puerto de acceso a entrenadores.
 *
 * Metodos con intencion de negocio (findByProfileId), nunca constructores de
 * consulta (select/eq/filters). Esa es la diferencia entre poder cambiar de
 * backend y no poder: si el puerto expone el lenguaje de consulta de PostgREST,
 * el desacoplamiento es ficticio.
 */
export interface TrainerRepository {
  findByProfileId(profileId: string): Promise<Trainer | null>

  /*
   * `create` YA NO ESTA AQUI. La ficha nace en el mismo acto que la cuenta, no
   * despues: con la confirmacion por correo activada el alta no abre sesion, y
   * sin sesion el cliente no puede escribir su propia fila. Lo hace el
   * proveedor -en Supabase, un disparador sobre `auth.users`- y en la
   * simulacion lo hace la raiz de composicion, que es quien puede saber que
   * «crear la cuenta» implica «crear la ficha». Ver `SignUpCredentials`.
   */

  /**
   * Cambia lo que un entrenador dice de sí mismo.
   *
   * `profileId` y `email` NO se tocan: el primero es la cuenta con la que entra
   * y el segundo es la llave por la que se le reconoce —es lo que enlaza a
   * alguien con su ficha al registrarse—. Cambiarlos desde una pantalla de
   * perfil dejaría a la persona fuera de su propia ficha.
   */
  updateProfile(trainerId: string, data: TrainerProfile): Promise<void>

  /**
   * Avisa de que la colección ha cambiado. Devuelve la función de baja.
   *
   * Hacía falta desde que el rol gobierna la navegación: al registrarse, la
   * ficha de entrenador nace DESPUÉS de que `useViewer` haya resuelto quién
   * entra, así que sin este aviso el recién registrado se quedaba sin rol hasta
   * recargar —y aterrizaba en la pantalla del alumno—. Lo cazó una prueba.
   */
  onChange(listener: () => void): () => void
}

/**
 * Datos con los que nace un entrenador.
 *
 * `verified` y `totalReviews` no estan: los pone el sistema -nadie se registra
 * verificado ni con reseñas-, y dejarlos en el alta seria invitar a mentir.
 *
 * SIGUE AQUI aunque el puerto ya no tenga `create`: lo usa la raiz de
 * composicion para que la autenticacion simulada haga lo mismo que el
 * disparador de Postgres. Es un tipo del dominio, no un detalle del adaptador.
 */
/** Lo que uno dice de sí mismo, y puede cambiar. */
export interface TrainerProfile {
  firstName: string
  lastName: string
  photoUrl?: string
  bio?: string
  yearsExperience?: number
}

export interface NewTrainer {
  profileId: string
  firstName: string
  lastName: string
  email: string
  bio?: string
  yearsExperience?: number
}
