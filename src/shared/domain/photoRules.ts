import { AppError, AppErrorCode } from './errors'
import { MAX_PHOTO_BYTES } from './ports/PhotoStorage'

/**
 * Lo que cuenta como foto. Regla del dominio, no del proveedor: los dos
 * adaptadores la aplican antes de aceptar un fichero, y una pantalla puede
 * aplicarla antes de llamar a ninguno.
 */
export function assertIsPhoto(file: File): void {
  if (!file.type.startsWith('image/')) {
    throw new AppError(AppErrorCode.VALIDATION, 'notAnImage')
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new AppError(AppErrorCode.VALIDATION, 'photoTooLarge', undefined, {
      max: Math.round(MAX_PHOTO_BYTES / 1024 / 1024),
    })
  }
}
