import type { PhotoStorage } from '@/shared/domain/ports/PhotoStorage'
import { assertIsPhoto } from '@/shared/domain/photoRules'

/**
 * Fotos simuladas: la direccion es una URL de objeto del propio navegador.
 *
 * Vale mientras dura la pestaña, que es exactamente lo que dura el resto de la
 * simulacion. Valida lo mismo que el adaptador real -tipo y tamaño- para que
 * la pantalla recorra sus caminos de error sin subir nada a ningun sitio.
 */
export class FakePhotoStorage implements PhotoStorage {
  async upload(file: File): Promise<string> {
    assertIsPhoto(file)
    return URL.createObjectURL(file)
  }
}
