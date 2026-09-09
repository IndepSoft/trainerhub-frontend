import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { useTranslation } from '@/shared/i18n/LanguageContext'

/**
 * Una dirección que no existe.
 *
 * SE DICE, en vez de mandar a la raíz en silencio. El comodín del router
 * redirigía a `/`, así que un enlace roto o una dirección mal tecleada dejaba
 * a la persona en su pantalla de inicio sin ninguna pista de que lo que buscaba
 * no estaba: creía haber llegado. Es también lo que se pinta cuando el router
 * falla al cargar una ruta.
 *
 * La salida es la raíz, que decide según el papel a dónde va cada uno.
 */
export default function NotFound() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-bone px-6 py-16 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/45">404</p>
      <h1 className="font-display text-3xl font-extrabold uppercase leading-none tracking-tight text-ink">
        {t('notFound.title')}
      </h1>
      <p className="max-w-sm text-sm text-ink/55">{t('notFound.body')}</p>
      <Button asChild variant="outline">
        <Link to="/">{t('notFound.home')}</Link>
      </Button>
    </div>
  )
}
