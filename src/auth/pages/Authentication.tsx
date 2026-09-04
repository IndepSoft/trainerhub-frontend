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
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-lg p-4">
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