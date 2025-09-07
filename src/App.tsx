import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function App() {
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
            <Button className="w-full">Comenzar</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default App