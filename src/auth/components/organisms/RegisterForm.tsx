import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import FormField from '../molecules/FormField'
import FormInputCustom from '../molecules/FormInputCustom'
import { Calendar, Lock, Mail, MapPin, User } from 'lucide-react'
import SelectFieldCustom from '../molecules/SelectFieldCustom'
import { useRegisterForm } from '../../hooks/useRegisterForm'

/**
 * Especialidades ofrecidas en el alta.
 *
 * OJO: la lista anterior era de desarrollo de software —«Desarrollo Web»,
 * «Data Science», «DevOps», «Machine Learning», «Cybersecurity»— en un registro
 * de ENTRENADORES. Venía copiada de otro proyecto. Importa mas que antes
 * porque este valor ya se guarda en la base de datos.
 *
 * TODO: revisar con producto. Son una propuesta razonable, no una decision
 * tomada.
 */
const ESPECIALIDADES = [
  'Entrenamiento de fuerza',
  'Pérdida de peso',
  'Acondicionamiento físico',
  'Preparación deportiva',
  'Rehabilitación y readaptación',
  'Nutrición deportiva',
  'Entrenamiento funcional',
  'Yoga y movilidad',
]

const EXPERIENCIAS = [
  '0-1 años',
  '1-3 años',
  '3-5 años',
  '5-10 años',
  'Más de 10 años',
]

export default function RegisterForm() {
  const {
    formData,
    isValid,
    isRequired,
    setField,
    submit,
    loading,
    error,
    confirmationNotice,
  } = useRegisterForm()

  const handleSubmit = (event: React.FormEvent) => {
    // Sin esto el navegador recarga la pagina entera al enviar: el
    // `handleSubmit` anterior no recibia el evento y no lo cancelaba, asi que el
    // formulario no habria podido funcionar nunca.
    event.preventDefault()
    void submit()
  }

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-semibold">
          Crear cuenta
        </CardTitle>
        <CardDescription>
          Únete a TrainerHub y gestiona tu negocio fitness
        </CardDescription>
      </CardHeader>
      
      <CardContent className='px-2'>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* El alta correcta pendiente de confirmar NO es un error: va en el
            aviso neutro, no en rojo. */}
        {confirmationNotice && (
          <Alert className="mb-4">
            <AlertDescription>{confirmationNotice}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Nombre" required={isRequired('nombre')}>
                <FormInputCustom
                  type="text"
                  placeholder="Juan"
                  value={formData.nombre}
                  onChange={(value) => setField('nombre', value)}
                  icon={User}
                  required
                />
              </FormField>

              <FormField label="Apellido" required={isRequired('apellido')}>
                <FormInputCustom
                  type="text"
                  placeholder="Pérez"
                  value={formData.apellido}
                  onChange={(value) => setField('apellido', value)}
                  required
                />
              </FormField>
            </div>

            {/* Email */}
            <FormField label="Email" required={isRequired('email')}>
              <FormInputCustom
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(value) => setField('email', value)}
                icon={Mail}
                required
              />
            </FormField>

            {/* Contraseña */}
            <FormField label="Contraseña" required={isRequired('password')}>
              <FormInputCustom
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(value) => setField('password', value)}
                icon={Lock}
                required
              />
            </FormField>

            {/* Especialidad */}
            <FormField label="Especialidad" required={isRequired('especialidad')}>
              <SelectFieldCustom
                placeholder="Selecciona tu especialidad"
                value={formData.especialidad}
                onChange={(value) => setField('especialidad', value)}
                options={ESPECIALIDADES}
              />
            </FormField>

            {/* Años de experiencia y Ubicación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Años de experiencia">
                <SelectFieldCustom
                  placeholder="Años"
                  value={formData.experiencia}
                  onChange={(value) => setField('experiencia', value)}
                  options={EXPERIENCIAS}
                  icon={Calendar}
                />
              </FormField>

              <FormField label="Ubicación">
                <FormInputCustom
                  type="text"
                  placeholder="Ciudad, País"
                  value={formData.ubicacion}
                  onChange={(value) => setField('ubicacion', value)}
                  icon={MapPin}
                  required={isRequired('ubicacion')}
                />
              </FormField>
            </div>

            <Button 
              type="submit" 
              className="w-full mt-6"
              disabled={!isValid || loading}
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
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
          <button 
            type="button"
            className="text-primary hover:underline font-medium"
          >
            Iniciar sesión
          </button>
        </p>
      </CardFooter>
    </>
  )
}
