import { useState } from 'react'
import { container } from '@/app/container'
import type { PhotoKind } from '@/shared/domain/ports/PhotoStorage'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { describeError } from '@/shared/i18n/errorMessages'

interface UsePhotoUploadResult {
  uploading: boolean
  error: string | null
  /** Sube el fichero y devuelve su dirección, o `null` si no se pudo. */
  upload: (file: File, kind: PhotoKind) => Promise<string | null>
}

/**
 * Subir una foto y quedarse con su dirección.
 *
 * Devuelve la dirección en vez de guardarla en ninguna ficha: la foto es un
 * campo de un formulario que ya sabía guardar direcciones tecleadas, y así
 * subir es rellenar ese campo. El formulario sigue decidiendo cuándo se
 * guarda, junto con el resto.
 */
export function usePhotoUpload(): UsePhotoUploadResult {
  const { t } = useTranslation()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = async (file: File, kind: PhotoKind): Promise<string | null> => {
    setError(null)
    setUploading(true)
    try {
      return await container.photos.upload(file, kind)
    } catch (caught) {
      setError(describeError(caught, t, 'settings.profile.error'))
      return null
    } finally {
      setUploading(false)
    }
  }

  return { uploading, error, upload }
}
