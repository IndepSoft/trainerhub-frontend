import type { PhotoKind, PhotoStorage } from '@/shared/domain/ports/PhotoStorage'
import { assertIsPhoto } from '@/shared/domain/photoRules'
import { AppError, AppErrorCode } from '@/shared/domain/errors'
import { supabase } from './client'

/** El cubo. Publico en lectura: una foto de perfil se enseña a quien la mire. */
const BUCKET = 'photos'

/**
 * Implementacion de PhotoStorage sobre Supabase Storage.
 *
 * LA RUTA ES `<cuenta>/<clase>/<uuid>.<ext>`, y la carpeta de la cuenta es lo
 * que la politica del cubo comprueba: cada uno escribe en la suya y en ninguna
 * otra. El nombre del fichero no viaja -es un uuid- porque un nombre elegido
 * por la persona puede llevar cualquier cosa, y porque dos fotos iguales de
 * dos personas no deben pisarse.
 *
 * La direccion que se devuelve es la publica y definitiva: es lo que
 * `photoUrl` guarda, y lo que el resto de la aplicacion ya sabia pintar.
 */
export class SupabasePhotoStorage implements PhotoStorage {
  async upload(file: File, kind: PhotoKind): Promise<string> {
    assertIsPhoto(file)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user === null) {
      throw new AppError(AppErrorCode.UNAUTHORIZED, 'sessionExpired')
    }

    const extension = file.name.includes('.') ? file.name.split('.').pop() : 'jpg'
    const path = `${user.id}/${kind}/${crypto.randomUUID()}.${extension}`

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false })
    if (error) {
      throw new AppError(AppErrorCode.UNKNOWN, 'dataAccessFailed', error)
    }

    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  }
}
