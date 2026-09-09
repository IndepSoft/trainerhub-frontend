import {
  Card,
  CardContent,
} from '@/shared/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { LoginForm } from '../components/LoginForm'
import { RegisterForm } from '../components/RegisterForm'
import { useTranslation } from '@/shared/i18n/LanguageContext'

export default function AuthenticationPage() {
  const { t } = useTranslation()

  return (
    /*
     * DESPLAZA, y centra con margenes automaticos en vez de `items-center`.
     *
     * Con `items-center` en un contenedor de la altura de la pantalla, un
     * formulario mas alto que ella se centraba y su parte de arriba quedaba
     * POR ENCIMA del borde, inalcanzable: a 375×667 el registro de entrenador
     * dejaba las pestañas a -150 px y «Crear cuenta» por debajo, sin scroll.
     * Un margen automatico centra igual cuando sobra sitio y no recorta cuando
     * falta. `min-h-0` deja que el contenedor encoja dentro del layout, que
     * es de altura fija y oculta su propio desbordamiento.
     */
    <div className="flex min-h-0 flex-1 overflow-y-auto bg-background">
      <div className="m-auto w-full max-w-lg p-4">
        <Card>
          <CardContent>
            <Tabs 
              defaultValue="login" 
              className="w-full"
              aria-label={t('auth.tabs')}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">
                  {t('auth.signIn')}
                </TabsTrigger>
                <TabsTrigger value="register">
                  {t('auth.register')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6">
                <LoginForm />
              </TabsContent>

              <TabsContent value="register" className="mt-6">
                <RegisterForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}