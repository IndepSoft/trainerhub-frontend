import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@radix-ui/react-label'
import { useAuthStore } from '@/app/stores/authStore'
import { Button } from '@/shared/ui/button'
import { useNavigate } from 'react-router-dom'

export default function LoginForm() {

  const navigate = useNavigate()
  const { login } = useAuthStore()
  const fakeToken: string = 'fakeTaxiDireToken'

  function handleLogin() {
    login(fakeToken)
    navigate('/dashboard')
  }

  return (
    <>
	    <CardHeader className="flex items-center">
        <CardTitle className="font-semibold text-xl">
          Bienvenido de vuelta
        </CardTitle>
        <CardDescription className='text-center'>
          Ingresa tus credenciales para acceder a tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2'>
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
        <Button onClick={handleLogin} type="submit" className="w-full">
          Login
        </Button>
        <Button variant="outline" className="w-full">
          Login with Google
        </Button>
      </CardFooter>
    </>
  )
}
