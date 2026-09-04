import { Dumbbell, UserRound } from 'lucide-react'
import { CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import type { RegisterIntent } from '../types/register.types'

interface RegisterIntentChooserProps {
  onChoose: (intent: RegisterIntent) => void
}

/**
 * Con qué vienes: a entrenar a gente, o a entrenar.
 *
 * SE PREGUNTA ANTES QUE NADA porque las dos altas no se parecen. El formulario
 * era uno solo y pedía especialidad, años de experiencia y ubicación a
 * cualquiera: a quien sólo quería ver sus entrenamientos le hacía declarar una
 * profesión que no tiene. Filtrar campos según una casilla dentro del mismo
 * formulario habría dejado la mitad de la pantalla apareciendo y desapareciendo.
 *
 * Las dos opciones tienen el mismo peso visual a propósito: ninguna es la
 * «normal», y empujar hacia la de entrenador con un botón más grande haría que
 * los alumnos se registraran mal.
 */
export function RegisterIntentChooser({ onChoose }: RegisterIntentChooserProps) {
  const { t } = useTranslation()

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-semibold">{t('register.createAccount')}</CardTitle>
        <CardDescription>{t('register.howWillYouUse')}</CardDescription>
      </CardHeader>

      <div className="grid grid-cols-1 gap-3 px-2 pb-2 sm:grid-cols-2">
        <IntentCard
          icon={<Dumbbell className="size-5" />}
          title={t('register.intent.trainer')}
          description={t('register.intent.trainerHint')}
          onClick={() => onChoose('trainer')}
        />
        <IntentCard
          icon={<UserRound className="size-5" />}
          title={t('register.intent.student')}
          description={t('register.intent.studentHint')}
          onClick={() => onChoose('student')}
        />
      </div>
    </>
  )
}

interface IntentCardProps {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
}

function IntentCard({ icon, title, description, onClick }: IntentCardProps) {
  return (
    <button
      type="button"
      /*
        El nombre accesible es el titulo, no la concatenacion de titulo y
        descripcion: un lector de pantalla leia «Entreno a gente Monta tu equipo,
        tus rutinas y tu agenda» como si fuera el nombre del control.
      */
      aria-label={title}
      onClick={onClick}
      className="flex min-h-11 flex-col items-start gap-2 rounded-block border border-cobalt-tint-3 p-4 text-start transition-colors hover:border-cobalt/50 hover:bg-cobalt-tint"
    >
      <span className="text-cobalt">{icon}</span>
      <span className="font-display text-lg font-extrabold uppercase leading-none tracking-tight text-ink">
        {title}
      </span>
      <span className="text-sm text-ink/55">{description}</span>
    </button>
  )
}
