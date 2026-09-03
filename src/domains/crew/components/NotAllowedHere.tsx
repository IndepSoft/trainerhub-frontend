import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface NotAllowedHereProps {
  /** Qué hace falta para estar aquí, en una frase. */
  description: string
}

/**
 * Qué ve quien llega a una pantalla que no le corresponde.
 *
 * SE DICE, no se finge que la ruta no existe. Un 404 sería más discreto y aquí
 * no compra nada: quien escribe la dirección a mano ya sabe que existe, y al
 * resto no se le ofrece el enlace. Lo que sí evita es el desconcierto de quien
 * llega por un enlace viejo, o de un entrenador al que le acaban de retirar una
 * llave y no entiende por qué.
 */
export function NotAllowedHere({ description }: NotAllowedHereProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-bone px-6 text-center">
      <h1 className="font-display text-3xl font-extrabold uppercase leading-none tracking-tight text-ink">
        {t('crew.notAllowed')}
      </h1>
      <p className="max-w-sm text-sm text-ink/55">{description}</p>
      <Button asChild variant="outline">
        <Link to="/crew">{t('crew.backToCrew')}</Link>
      </Button>
    </div>
  )
}
