import { router } from '@/app/routes'
import { useAuthStore } from '@/app/stores/authStore'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Input } from '@/shared/ui/input'
import { Label } from '@radix-ui/react-label'
import { useNavigate } from 'react-router-dom'

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const fakeToken: string = 'fakeTaxiDireToken'

  function handleLogin() {
    login(fakeToken)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background  flex items-center justify-center">
      <div className=" w-full max-w-md mx-auto mt-10 p-4">
        <div className="flex flex-col items-center mb-8">
          <span className="text-3xl font-bold text-primary mb-2">
            TrainerHub
          </span>
          <p className="text-muted-foreground">
            Plataforma profesional para entrenadores personales
          </p>
        </div>

        <Card className="w-full max-w-sm">
          <Tabs defaultValue="account" className=" flex justify-center p-4">
            <TabsList className="w-full ">
              <TabsTrigger value="account">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="password">Registrarme</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
              <CardHeader className="flex items-center">
                <CardTitle className="font-semibold text-xl">
                  Bienvenido de vuelta
                </CardTitle>
                <CardDescription>
                  Ingresa tus credenciales para acceder a tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form>
                  <div className="flex flex-col gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center">
                        <Label htmlFor="password">Password</Label>
                        <a
                          href="#"
                          className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                        >
                          Forgot your password?
                        </a>
                      </div>
                      <Input id="password" type="password" required />
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <Button type="submit" className="w-full">
                  Login
                </Button>
                <Button variant="outline" className="w-full">
                  Login with Google
                </Button>
              </CardFooter>
            </TabsContent>
            <TabsContent value="password"></TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
