
import {
  Card,
} from '@/shared/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'

import LoginForm from '../components/organisms/LoginForm'
import RegisterForm from '../components/organisms/RegisterForm'

export default function Authentication() {


  return (
    <div className="min-h-screen bg-background  flex items-center justify-center">
      <div className=" w-full max-w-lg mx-auto mt-10 p-4">
        <div className="flex flex-col items-center mb-8">
          <span className="text-3xl font-bold text-primary mb-2">
            TrainerHub
          </span>
          <p className="text-muted-foreground text-center">
            Plataforma profesional para entrenadores personales
          </p>
        </div>

        <Card className="w-full ">
          <Tabs defaultValue="login" className=" flex justify-center p-4">
            <TabsList className="w-full ">
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="register">Registrarme</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm></LoginForm>
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm></RegisterForm>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
