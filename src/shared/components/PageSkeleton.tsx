import { Skeleton } from '@/shared/ui/skeleton'
import { useTranslation } from '@/shared/i18n/LanguageContext'

/**
 * Esqueleto de una página mientras carga su fragmento.
 *
 * Sustituye al indicador giratorio. La diferencia no es estética: un esqueleto
 * reserva el sitio que van a ocupar la cabecera y los bloques, así que cuando el
 * contenido llega no salta nada. Un indicador centrado deja la pantalla vacía y
 * después la llena de golpe.
 *
 * Reproduce la estructura del registro sobrio —cabecera, fila de métricas
 * separada por reglas, dos columnas— porque es la que comparten dashboard,
 * progreso y reportes, que son las rutas más pesadas y por tanto las que más
 * tiempo lo muestran.
 */
export function PageSkeleton() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone" aria-busy="true">
      <span className="sr-only">{t('common.loading')}</span>

      <header className="shrink-0 px-5 pt-6 pb-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-9 w-52" />
      </header>

      <div className="grid grid-cols-1 divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3 sm:grid-cols-2 lg:grid-cols-4 sm:divide-x sm:divide-y-0">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex flex-col gap-3 px-5 py-6">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-10 px-5 py-8 lg:flex-row lg:gap-12">
        {Array.from({ length: 2 }, (_, columna) => (
          <div key={columna} className="flex-1">
            <Skeleton className="h-3 w-36" />
            <div className="mt-6 space-y-6">
              {Array.from({ length: 3 }, (_, fila) => (
                <div key={fila} className="flex gap-4">
                  <Skeleton className="size-[15px] shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
