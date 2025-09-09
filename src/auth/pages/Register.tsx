import { router } from "@/app/routes"
import { useAuthStore } from "@/app/stores/authStore"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const {login} = useAuthStore(); 
  const fakeToken: string = "fakeTaxiDireToken";

  function handleLogin()
  {
    login(fakeToken)
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center">TrainerHub</h1>

        <Card>
          <CardHeader>
            <CardTitle>¡shadcn/ui funcionando!</CardTitle>
            <CardDescription>
              Tailwind v3 + shadcn/ui + React 19
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="trainer@example.com" />
            </div>
            <Button onClick={handleLogin} className="w-full">Comenzar</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
