import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { useRegisterForm } from '../hooks/useRegisterForm'
import { EXPERIENCE_RANGE_KEYS, TRAINER_SPECIALTY_KEYS } from '../data/registerOptions'
import type { RegisterFormField } from '../types/register.types'
import { AuthHero } from './AuthHero'
import { AuthScreen } from './AuthScreen'
import { ConfirmEmailNotice } from './ConfirmEmailNotice'
import { FormField } from './FormField'
import { FormInput } from './FormInput'
import { RegisterFields } from './RegisterFields'
import { SelectField } from './SelectField'
import { StepIndicator } from './StepIndicator'

interface TrainerRegisterFormProps {
  onBack: () => void
}

type TrainerStep = 1 | 2

const TOTAL_STEPS = 2

/**
 * Lo que hay que haber rellenado para pasar del primer paso.
 *
 * Son los campos del paso, no los del formulario entero: exigir la
 * especialidad para poder avanzar a la pantalla donde se pide sería un
 * candado sin llave.
 */
const STEP_ONE_FIELDS: RegisterFormField[] = ['firstName', 'lastName', 'email', 'password']

/**
 * Alta de entrenador, en dos pasos: quién eres, y a qué te dedicas.
 *
 * EN DOS PASOS POR DOS MOTIVOS, y el segundo pesa más. El de forma: es el
 * patrón de referencia del rediseño. El de función: siete campos con la
 * cabecera y el botón medían más que un teléfono de 667 px, y la pantalla
 * anterior los recortaba. Partidos, cada paso cabe.
 *
 * El corte no es por cantidad sino por significado: primero lo que pide
 * cualquier alta —nombre, correo, contraseña— y después lo que sólo pide ésta.
 * El estado del formulario es uno solo, en `useRegisterForm`; lo que aquí se
 * guarda es en qué paso se está.
 *
 * NO PROMETE NADA QUE NO PUEDA CUMPLIR. Al terminar se crea el equipo, pero
 * incorporar alumnos espera a que la plataforma active la suscripción, así que
 * se dice en el segundo paso en vez de descubrirlo al llegar al QR. Enterarse
 * tarde de una condición se lee como una trampa; leerlo antes, como un precio.
 */
export function TrainerRegisterForm({ onBack }: TrainerRegisterFormProps) {
  const { t } = useTranslation()
  const { formData, isValid, loading, error, awaitingConfirmation, isRequired, setField, submit } =
    useRegisterForm('trainer')
  const [step, setStep] = useState<TrainerStep>(1)

  const canAdvance = STEP_ONE_FIELDS.every((field) => formData[field].trim().length > 0)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    // Sin esto el navegador recarga la pagina entera al enviar. Y en el primer
    // paso, la tecla Intro avanza en vez de mandar un alta a medias.
    event.preventDefault()
    if (step === 1) {
      if (canAdvance) setStep(2)
      return
    }
    void submit()
  }

  /*
    La cuenta ya existe y falta confirmar el correo. Se SUSTITUYE el formulario
    en vez de añadir un aviso encima: dejarlo a la vista invita a volver a
    enviarlo, y el segundo intento choca con «ya existe una cuenta con ese
    correo», que se lee como un fallo cuando en realidad ya salió bien.
  */
  if (awaitingConfirmation) return <ConfirmEmailNotice email={formData.email.trim()} />

  if (step === 1) {
    return (
      <AuthScreen
        hero={
          <AuthHero
            eyebrow={`${t('register.trainer.eyebrow')} · ${t('register.step', { step: 1, total: TOTAL_STEPS })}`}
            headlineLines={[t('register.trainer.step1.line1'), t('register.trainer.step1.line2')]}
            height="medium"
            back={{ label: t('register.trainer.backToStudent'), onClick: onBack }}
          />
        }
      >
        <StepIndicator current={1} total={TOTAL_STEPS} />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5">
          <RegisterFields
            formData={formData}
            isRequired={isRequired}
            setField={setField}
            disabled={loading}
          />

          <div className="mt-auto flex flex-col gap-3 pt-3">
            <Button type="submit" className="w-full gap-2 rounded-action" disabled={!canAdvance}>
              {t('common.next')}
              <ArrowRight aria-hidden="true" className="size-4" strokeWidth={2.25} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full rounded-action text-ink/55"
              onClick={onBack}
            >
              {t('register.trainer.backToStudent')}
            </Button>
          </div>
        </form>
      </AuthScreen>
    )
  }

  return (
    <AuthScreen>
      <div className="relative isolate flex flex-col gap-5">
        {/* Sin foto en el segundo paso: la cuña queda como huella, en Ember al
            10 %, igual que en las tarjetas. Detrás del titular, no del todo. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[-15%] top-[92px] -z-10 h-[72px] bg-ember/10"
          style={{ clipPath: 'polygon(0 42%, 100% 0, 100% 58%, 0 100%)' }}
        />

        <div className="flex h-11 items-center justify-between">
          <button
            type="button"
            aria-label={t('common.previous')}
            onClick={() => setStep(1)}
            className="-ml-3 inline-flex size-11 items-center justify-center rounded-action text-ink transition-colors hover:bg-ink/5"
          >
            <ArrowLeft aria-hidden="true" className="size-6" strokeWidth={2.25} />
          </button>
          <span className="font-display text-lg font-extrabold uppercase leading-none tracking-tight text-ink">
            TrainerHub
          </span>
        </div>

        <StepIndicator current={2} total={TOTAL_STEPS} />

        <div className="flex flex-col gap-2.5 pt-2">
          <p className="font-display text-sm font-bold uppercase tracking-[0.3em] text-ember">
            {t('register.trainer.eyebrow')} · {t('register.step', { step: 2, total: TOTAL_STEPS })}
          </p>
          <h1 className="font-display text-[3.25rem] font-extrabold uppercase leading-[0.88] tracking-tight text-ink">
            <span className="block">{t('register.trainer.step2.line1')}</span>
            <span className="block">{t('register.trainer.step2.line2')}</span>
          </h1>
          <p className="mt-1.5 max-w-[30ch] text-sm leading-relaxed text-ink/55">
            {t('register.trainer.subscriptionHint')}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 pt-2">
        <FormField
          htmlFor="register-specialty"
          label={t('register.trainer.specialty')}
          optional={!isRequired('specialty')}
        >
          <SelectField
            id="register-specialty"
            placeholder={t('register.trainer.specialtyPlaceholder')}
            value={formData.specialty}
            onChange={(value) => setField('specialty', value)}
            options={TRAINER_SPECIALTY_KEYS.map((key) => t(key))}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
          <FormField
            htmlFor="register-experience"
            label={t('register.trainer.experience')}
            optional={!isRequired('yearsOfExperience')}
          >
            <SelectField
              id="register-experience"
              placeholder={t('register.trainer.experiencePlaceholder')}
              value={formData.yearsOfExperience}
              onChange={(value) => setField('yearsOfExperience', value)}
              options={EXPERIENCE_RANGE_KEYS.map((key) => t(key))}
            />
          </FormField>

          <FormField
            htmlFor="register-location"
            label={t('register.trainer.location')}
            optional={!isRequired('location')}
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
              required={isRequired('location')}
              disabled={loading}
            />
          </FormField>
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-3">
          <Button type="submit" className="w-full rounded-action" disabled={!isValid || loading}>
            {loading ? t('register.creatingAccount') : t('register.createAccount')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full rounded-action text-ink/55"
            onClick={() => setStep(1)}
          >
            {t('common.previous')}
          </Button>
        </div>
      </form>
    </AuthScreen>
  )
}
