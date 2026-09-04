import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { PageHeader } from '@/shared/components/PageHeader'
import { useViewerContext } from '@/app/ViewerContext'
import { PlatformCrews } from '../components/PlatformCrews'
import { PlatformUsers } from '../components/PlatformUsers'
import { useTranslation } from '@/shared/i18n/LanguageContext'

/**
 * El panel de la plataforma. Sólo composición.
 *
 * DOS PESTAÑAS PORQUE SON DOS TRABAJOS DISTINTOS: abrirle la puerta a un equipo
 * nuevo —la suscripción— y arreglarle el acceso a una persona concreta. Quien
 * entra sabe cuál de los dos viene a hacer, así que separarlos no esconde nada;
 * juntarlos en una sola lista sí obligaría a buscar.
 *
 * LO QUE NO HAY AQUÍ ES CONTENIDO DE NADIE. Se administran cuentas, equipos y
 * accesos; ni una sesión, ni una rutina, ni un dato de salud de un alumno ajeno.
 * Para ver la aplicación funcionando, quien administra tiene su propio equipo.
 *
 * ESCONDER ESTA PANTALLA NO ES LA SEGURIDAD. La página comprueba quién entra, y
 * eso evita que se muestre por error; lo que impide de verdad que alguien se
 * ascienda solo es la política del servidor, que todavía no existe. Está anotado
 * en `PlatformRepository`.
 */
export default function PlatformAdmin() {
  const { t } = useTranslation()
  const { isPlatformAdmin, loading } = useViewerContext()

  if (loading) return null
  if (!isPlatformAdmin) return <NotAllowed />

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      <PageHeader className="pb-4">
        <PageHeader.Eyebrow>{t('platform.eyebrow')}</PageHeader.Eyebrow>
        <PageHeader.Title>{t('platform.title')}</PageHeader.Title>
      </PageHeader>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl px-5 py-6">
          <Tabs defaultValue="equipos">
            {/* Dos columnas y no `inline-flex`: a 375 px, dos pestañas en línea
                dejaban la segunda pegada al borde. */}
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="equipos">{t('platform.tab.crews')}</TabsTrigger>
              <TabsTrigger value="cuentas">{t('platform.tab.accounts')}</TabsTrigger>
            </TabsList>

            <TabsContent value="equipos" className="mt-6">
              <PlatformCrews />
            </TabsContent>

            <TabsContent value="cuentas" className="mt-6">
              <PlatformUsers />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

/**
 * Qué ve quien llega aquí sin ser administrador.
 *
 * Se dice que no le corresponde, en vez de fingir que la ruta no existe. Un 404
 * sería más discreto y aquí no compra nada: quien escribe `/admin` a mano ya
 * sabe que existe, y al resto no se le ofrece el enlace.
 */
function NotAllowed() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-bone px-6 text-center">
      <h1 className="font-display text-3xl font-extrabold uppercase leading-none tracking-tight text-ink">
        {t('platform.notAllowed')}
      </h1>
      <p className="max-w-sm text-sm text-ink/55">
        {t('platform.notAllowedHint')}
      </p>
      <Button asChild variant="outline">
        <Link to="/">{t('platform.back')}</Link>
      </Button>
    </div>
  )
}
