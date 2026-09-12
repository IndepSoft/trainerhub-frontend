import { ArrowRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/shared/lib/utils'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { authViewSearch } from '../libs/authView'
import type { RegisterIntent } from '../types/register.types'
import { AuthHero } from './AuthHero'
import { AuthScreen } from './AuthScreen'

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
 * los alumnos se registraran mal. Son dos bloques iguales, a escuadra —el radio
 * de los bloques—, y lo único que cambia entre ellos es el relleno.
 */
export function RegisterIntentChooser({ onChoose }: RegisterIntentChooserProps) {
  const { t } = useTranslation()
  const location = useLocation()

  return (
    <AuthScreen
      hero={
        <AuthHero
          eyebrow={t('register.createAccount')}
          headlineLines={[
            t('register.hero.intent.line1'),
            t('register.hero.intent.line2'),
            t('register.hero.intent.line3'),
          ]}
          height="tall"
        />
      }
    >
      <div className="flex flex-col gap-3">
        <IntentBlock
          title={t('register.intent.trainer')}
          description={t('register.intent.trainerHint')}
          filled
          onClick={() => onChoose('trainer')}
        />
        <IntentBlock
          title={t('register.intent.student')}
          description={t('register.intent.studentHint')}
          onClick={() => onChoose('student')}
        />
      </div>

      <p className="mt-auto flex min-h-11 items-center justify-center gap-1.5 text-sm text-ink/55">
        {t('auth.haveAccount')}
        <Link
          to={{ search: authViewSearch('login') }}
          state={location.state}
          className="font-semibold text-cobalt underline-offset-4 hover:underline"
        >
          {t('auth.signIn')}
        </Link>
      </p>
    </AuthScreen>
  )
}

interface IntentBlockProps {
  title: string
  description: string
  /**
   * El bloque de arriba va en Ink sólido y el de abajo en contorno. No es una
   * jerarquía —pesan lo mismo—, es alternancia: dos contornos seguidos se
   * leían como una lista, no como dos puertas.
   */
  filled?: boolean
  onClick: () => void
}

function IntentBlock({ title, description, filled = false, onClick }: IntentBlockProps) {
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
      className={cn(
        'flex min-h-[108px] w-full items-center justify-between gap-4 rounded-block border px-5 py-5 text-start transition-colors',
        filled
          ? 'border-ink bg-ink text-bone hover:bg-ink/90'
          : 'border-ink/25 bg-transparent text-ink hover:border-cobalt/50 hover:bg-cobalt-tint'
      )}
    >
      <span className="flex flex-col gap-1.5">
        <span className="font-display text-[1.625rem] font-extrabold uppercase leading-none tracking-tight">
          {title}
        </span>
        <span className={cn('text-sm leading-snug', filled ? 'text-bone/60' : 'text-ink/55')}>
          {description}
        </span>
      </span>
      <ArrowRight
        aria-hidden="true"
        className={cn('size-6 shrink-0', filled ? 'text-ember' : 'text-ink/35')}
        strokeWidth={2.25}
      />
    </button>
  )
}
