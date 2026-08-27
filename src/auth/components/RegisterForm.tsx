import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Calendar, Lock, Mail, MapPin, User } from 'lucide-react'
import { FormField } from './FormField'
import { FormInput } from './FormInput'
import { SelectField } from './SelectField'
import { useRegisterForm } from '../hooks/useRegisterForm'
import {
  EXPERIENCE_RANGES,
  TRAINER_SPECIALTIES,
} from '../data/registerOptions'

export function RegisterForm() {
  const { formData, isValid, isRequired, setField, submit } = useRegisterForm()

  const handleSubmit = (event: React.FormEvent) => {
    // Sin esto el navegador recarga la pagina entera al enviar: el
    // `handleSubmit` anterior no recibia el evento y no lo cancelaba.
    event.preventDefault()
    submit()
  }

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-semibold">Crear cuenta</CardTitle>
        <CardDescription>
          Únete a TrainerHub y gestiona tu negocio fitness
        </CardDescription>
      </CardHeader>

      <CardContent className="px-2">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                htmlFor="register-first-name"
                label="Nombre"
                required={isRequired('firstName')}
              >
                <FormInput
                  id="register-first-name"
                  placeholder="Juan"
                  value={formData.firstName}
                  onChange={(value) => setField('firstName', value)}
                  icon={User}
                  required
                />
              </FormField>

              <FormField
                htmlFor="register-last-name"
                label="Apellido"
                required={isRequired('lastName')}
              >
                <FormInput
                  id="register-last-name"
                  placeholder="Pérez"
                  value={formData.lastName}
                  onChange={(value) => setField('lastName', value)}
                  required
                />
              </FormField>
            </div>

            <FormField
              htmlFor="register-email"
              label="Email"
              required={isRequired('email')}
            >
              <FormInput
                id="register-email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(value) => setField('email', value)}
                icon={Mail}
                required
              />
            </FormField>

            <FormField
              htmlFor="register-password"
              label="Contraseña"
              required={isRequired('password')}
            >
              <FormInput
                id="register-password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(value) => setField('password', value)}
                icon={Lock}
                required
              />
            </FormField>

            <FormField
              htmlFor="register-specialty"
              label="Especialidad"
              required={isRequired('specialty')}
            >
              <SelectField
                id="register-specialty"
                placeholder="Selecciona tu especialidad"
                value={formData.specialty}
                onChange={(value) => setField('specialty', value)}
                options={TRAINER_SPECIALTIES}
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                htmlFor="register-experience"
                label="Años de experiencia"
                required={isRequired('yearsOfExperience')}
              >
                <SelectField
                  id="register-experience"
                  placeholder="Años"
                  value={formData.yearsOfExperience}
                  onChange={(value) => setField('yearsOfExperience', value)}
                  options={EXPERIENCE_RANGES}
                  icon={Calendar}
                />
              </FormField>

              <FormField
                htmlFor="register-location"
                label="Ubicación"
                required={isRequired('location')}
              >
                {/*
                  `required` sale de la misma lista que usa la validacion. Antes
                  el input lo llevaba a fuego y `isFormValid` no lo comprobaba:
                  el navegador bloqueaba el envio por un campo que la validacion
                  consideraba opcional.
                */}
                <FormInput
                  id="register-location"
                  placeholder="Ciudad, País"
                  value={formData.location}
                  onChange={(value) => setField('location', value)}
                  icon={MapPin}
                  required={isRequired('location')}
                />
              </FormField>
            </div>

            <Button type="submit" className="w-full mt-6" disabled={!isValid}>
              Crear cuenta
            </Button>
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex-col gap-2">
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              O continúa con
            </span>
          </div>
        </div>

        <Button variant="outline" className="w-full" type="button">
          <Mail className="mr-2 h-4 w-4" />
          Continuar con Google
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-4">
          ¿Ya tienes una cuenta?{' '}
          <button type="button" className="text-primary hover:underline font-medium">
            Iniciar sesión
          </button>
        </p>
      </CardFooter>
    </>
  )
}
