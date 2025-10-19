import {
  Card,
  CardContent,
} from '@/shared/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import LoginForm from '../components/organisms/LoginForm'
import RegisterForm from '../components/organisms/RegisterForm'

export default function AuthenticationPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-lg p-4">
        <Card>
          <CardContent className="p-6">
            <Tabs 
              defaultValue="login" 
              className="w-full"
              aria-label="Formularios de autenticación"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">
                  Iniciar sesión
                </TabsTrigger>
                <TabsTrigger value="register">
                  Registrarme
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