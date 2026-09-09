/**
 * Puerto de fotos: un fichero entra, una dirección sale.
 *
 * ES LA PRIMERA VEZ QUE LA APLICACIÓN GUARDA FICHEROS, y el puerto lo dice en
 * lo que expone y en lo que no: recibe el fichero y devuelve la dirección con
 * la que el resto del dominio ya trabajaba —`photoUrl` era una dirección
 * tecleada—. Ni nombres de cubo, ni rutas, ni políticas: eso es del adaptador.
 *
 * `kind` dice de quién es la foto, y decide dónde se guarda y quién puede
 * tocarla: cada cuenta escribe en su propia carpeta y en ninguna otra.
 */
export interface PhotoStorage {
  upload(file: File, kind: PhotoKind): Promise<string>
}

/** De quién es la foto: la propia, o la de un alumno de la libreta. */
export type PhotoKind = 'profile' | 'student'

/** Tope de tamaño. Una foto de perfil no necesita más, y el plan gratuito lo agradece. */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024
