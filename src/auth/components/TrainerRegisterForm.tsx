import { ArrowLeft, Calendar, MapPin } from 'lucide-react'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { FormField } from './FormField'
import { FormInput } from './FormInput'
import { SelectField } from './SelectField'
import { RegisterFields } from './RegisterFields'
import { useRegisterForm } from '../hooks/useRegisterForm'
import { EXPERIENCE_RANGE_KEYS, TRAINER_SPECIALTY_KEYS } from '../data/registerOptions'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface TrainerRegisterFormProps {
  onBack: () => void
}

/**
 * Alta de entrenador.
 *
 * Es el formulario que había, menos los campos comunes —que ahora comparte con
 * el del alumno— y con lo suyo: especialidad, experiencia y ubicación.
 *
 * NO PROMETE NADA QUE NO PUEDA CUMPLIR. Al terminar se crea el equipo, pero
 * incorporar alumnos espera a que la plataforma active la suscripción, así que
 * se dice aquí en vez de descubrirlo al llegar al QR. Enterarse tarde de una
 * condición se lee como una trampa; leerlo antes, como un precio.
 */
export function TrainerRegisterForm({ onBack }: TrainerRegisterFormProps) {
  const { t } = useTranslation()
  const { formData, isValid, loading, error, isRequired, setField, submit } =
    useRegisterForm('trainer')

  const handleSubmit = (event: React.FormEvent) => {
    // Sin esto el navegador recarga la pagina entera al enviar.
    event.preventDefault()
    void submit()
  }

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-semibold">{t('register.trainer.title')}</CardTitle>
        <CardDescription>
          {t('register.trainer.hint')}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-2">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <RegisterFields formData={formData} isRequired={isRequired} setField={setField} />

            <FormField
              htmlFor="register-specialty"
              label={t('register.trainer.specialty')}
              required={isRequired('specialty')}
            >
              <SelectField
                id="register-specialty"
                placeholder={t('register.trainer.specialtyPlaceholder')}
                value={formData.specialty}
                onChange={(value) => setField('specialty', value)}
                options={TRAINER_SPECIALTY_KEYS.map((key) => t(key))}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                htmlFor="register-experience"
                label={t('register.trainer.experience')}
                required={isRequired('yearsOfExperience')}
              >
                <SelectField
                  id="register-experience"
                  placeholder={t('register.trainer.experiencePlaceholder')}
                  value={formData.yearsOfExperience}
                  onChange={(value) => setField('yearsOfExperience', value)}
                  options={EXPERIENCE_RANGE_KEYS.map((key) => t(key))}
                  icon={Calendar}
                />
              </FormField>

              <FormField
                htmlFor="register-location"
                label={t('register.trainer.location')}
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
                  placeholder={t('register.trainer.locationPlaceholder')}
                  value={formData.location}
                  onChange={(value) => setField('location', value)}
                  icon={MapPin}
                  required={isRequired('location')}
                />
              </FormField>
            </div>

            <Button type="submit" className="mt-6 w-full" disabled={!isValid || loading}>
              {loading ? t('register.creatingAccount') : t('register.createAccount')}
            </Button>

            <Button type="button" variant="ghost" className="w-full gap-2" onClick={onBack}>
              <ArrowLeft className="size-4" />
              {t('register.trainer.backToStudent')}
            </Button>
          </div>
        </form>
      </CardContent>
    </>
  )
}
