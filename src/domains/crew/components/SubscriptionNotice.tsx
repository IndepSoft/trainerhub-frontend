import { Lock, Send } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import type { Crew } from '@/shared/domain/entities/crew'
import { activeLocale } from '@/shared/i18n/activeLocale'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface SubscriptionNoticeProps {
  crew: Crew
  /** Pide la activación. Sólo se ofrece con la suscripción pendiente. */
  onRequestActivation: () => Promise<void>
  requesting: boolean
  error: string | null
}

/**
 * Por qué no se puede invitar a nadie todavía, Y QUÉ HACER AL RESPECTO.
 *
 * OCUPA EL SITIO DEL QR, no lo esconde. Un hueco donde debería estar la forma de
 * meter gente se lee como que la aplicación está rota, y el entrenador se pone a
 * buscar el botón. Decirlo cuesta un párrafo y ahorra el mensaje de soporte.
 *
 * Los dos estados se explican distinto a propósito: «pendiente» es algo que
 * todavía no ha pasado, «suspendida» es algo que se retiró. Darles el mismo
 * texto haría que quien pagó y se quedó fuera pensara que nunca llegó a activar.
 *
 * TIENE UNA ACCIÓN. Antes explicaba que hacía falta activar y ahí terminaba:
 * la activación es manual desde el panel de plataforma, y quien lo administra
 * no sabía quién estaba esperando de verdad. Pedirla deja fecha, y la fecha se
 * enseña aquí para que se vea que la petición consta.
 */
export function SubscriptionNotice({
  crew,
  onRequestActivation,
  requesting,
  error,
}: SubscriptionNoticeProps) {
  const { t } = useTranslation()
  /*
   * Con la suscripcion activa esto no se pinta. Quien lo monta ya lo comprueba
   * con `canEnrollMembers`, asi que este caso no ocurre; se cubre igualmente
   * porque la alternativa era estrechar el tipo en la llamada, y eso obligaba a
   * repetir la regla ahi en vez de preguntarla al dominio.
   */
  if (crew.subscriptionStatus === 'active') return null

  const isPending = crew.subscriptionStatus === 'pending'
  const requestedAt = crew.activationRequestedAt

  return (
    <section className="rounded-block border border-cobalt-tint-3 bg-surface px-5 py-6">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ember-deep">
        <Lock aria-hidden="true" className="size-3.5" />
        {isPending
          ? t('crew.subscriptionPending')
          : t('crew.subscriptionSuspended')}
      </p>

      <h2 className="mt-2 font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
        {t('crew.cannotInviteYet')}
      </h2>

      <p className="mt-2 text-sm text-ink/60">
        {isPending ? t('crew.pendingHint') : t('crew.suspendedHint')}
      </p>

      {isPending &&
        (requestedAt !== null ? (
          <p className="mt-4 text-sm font-semibold text-ink">
            {t('crew.activationRequested', {
              date: new Date(requestedAt).toLocaleDateString(activeLocale(), {
                day: 'numeric',
                month: 'long',
              }),
            })}
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            <Button
              className="gap-2"
              disabled={requesting}
              onClick={() => void onRequestActivation()}
            >
              <Send className="size-4" />
              {t('crew.requestActivation')}
            </Button>
            {error !== null && <p className="text-sm text-danger">{error}</p>}
          </div>
        ))}
    </section>
  )
}
