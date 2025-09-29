import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@radix-ui/react-label'
import { Button } from '@/shared/ui/button'
import FormField from '../molecules/FormField'
import FormInputCustom from '../molecules/FormInputCustom'
import { Calendar, Lock, Mail, MapPin, User } from 'lucide-react'
import SelectFieldCustom from '../molecules/SelectFieldCustom'

interface UserFormData {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  especialidad: string;
  experiencia: string;
  ubicacion: string;
}

export default function RegisterForm() {

const [formData, setFormData] = useState<UserFormData>({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    especialidad: '',
    experiencia: '',
    ubicacion: ''
  });

  const especialidades = [
    'Desarrollo Web',
    'Desarrollo Mobile',
    'Data Science',
    'DevOps',
    'UI/UX Design',
    'Backend Development',
    'Frontend Development',
    'Machine Learning',
    'Cybersecurity'
  ];

  const experiencias = [
    '0-1 años',
    '1-3 años',
    '3-5 años',
    '5-10 años',
    'Más de 10 años'
  ];

  const handleFieldChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    console.log('Datos del formulario:', formData);
    // Aquí podrías agregar validación y envío
  };

  const isFormValid = () => {
    return formData.nombre && 
           formData.apellido && 
           formData.email && 
           formData.password && 
           formData.especialidad;
  };

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-semibold">
          Crear cuenta
        </CardTitle>
        <CardDescription>
          Únete a TrainerPro y gestiona tu negocio fitness
        </CardDescription>
      </CardHeader>
      
      <CardContent className='px-2'>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Nombre" required>
                <FormInputCustom
                  type="text"
                  placeholder="Juan"
                  value={formData.nombre}
                  onChange={(value) => handleFieldChange('nombre', value)}
                  icon={User}
                  required
                />
              </FormField>

              <FormField label="Apellido" required>
                <FormInputCustom
                  type="text"
                  placeholder="Pérez"
                  value={formData.apellido}
                  onChange={(value) => handleFieldChange('apellido', value)}
                  required
                />
              </FormField>
            </div>

            {/* Email */}
            <FormField label="Email" required>
              <FormInputCustom
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(value) => handleFieldChange('email', value)}
                icon={Mail}
                required
              />
            </FormField>

            {/* Contraseña */}
            <FormField label="Contraseña" required>
              <FormInputCustom
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(value) => handleFieldChange('password', value)}
                icon={Lock}
                required
              />
            </FormField>

            {/* Especialidad */}
            <FormField label="Especialidad" required>
              <SelectFieldCustom
                placeholder="Selecciona tu especialidad"
                value={formData.especialidad}
                onChange={(value) => handleFieldChange('especialidad', value)}
                options={especialidades}
              />
            </FormField>

            {/* Años de experiencia y Ubicación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Años de experiencia">
                <SelectFieldCustom
                  placeholder="Años"
                  value={formData.experiencia}
                  onChange={(value) => handleFieldChange('experiencia', value)}
                  options={experiencias}
                  icon={Calendar}
                />
              </FormField>

              <FormField label="Ubicación">
                <FormInputCustom
                  type="text"
                  placeholder="Ciudad, País"
                  value={formData.ubicacion}
                  onChange={(value) => handleFieldChange('ubicacion', value)}
                  icon={MapPin}
                  required
                />
              </FormField>
            </div>

            <Button 
              type="submit" 
              className="w-full mt-6"
              disabled={!isFormValid()}
            >
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
