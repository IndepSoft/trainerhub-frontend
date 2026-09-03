import { Lock } from 'lucide-react'
import type { SubscriptionStatus } from '@/shared/domain/entities/crew'
import { useTranslation } from '@/shared/i18n/LanguageContext'

interface SubscriptionNoticeProps {
  status: SubscriptionStatus
}

/**
 * Por qué no se puede invitar a nadie todavía.
 *
 * OCUPA EL SITIO DEL QR, no lo esconde. Un hueco donde debería estar la forma de
 * meter gente se lee como que la aplicación está rota, y el entrenador se pone a
 * buscar el botón. Decirlo cuesta un párrafo y ahorra el mensaje de soporte.
 *
 * Los dos estados se explican distinto a propósito: «pendiente» es algo que
 * todavía no ha pasado, «suspendida» es algo que se retiró. Darles el mismo
 * texto haría que quien pagó y se quedó fuera pensara que nunca llegó a activar.
 */
export function SubscriptionNotice({ status }: SubscriptionNoticeProps) {
  const { t } = useTranslation()
  /*
   * Con la suscripcion activa esto no se pinta. Quien lo monta ya lo comprueba
   * con `canEnrollMembers`, asi que este caso no ocurre; se cubre igualmente
   * porque la alternativa era estrechar el tipo en la llamada, y eso obligaba a
   * repetir la regla ahi en vez de preguntarla al dominio.
   */
  if (status === 'active') return null

  const isPending = status === 'pending'

  return (
    <section className="rounded-block border border-cobalt-tint-3 bg-surface px-5 py-6">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ember-deep">
        <Lock aria-hidden="true" className="size-3.5" />
        {isPending ? t('crew.subscriptionPending') : t('crew.subscriptionSuspended')}
      </p>

      <h2 className="mt-2 font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
        {t('crew.cannotInviteYet')}
      </h2>

      <p className="mt-2 text-sm text-ink/60">
        {isPending ? t('crew.pendingHint') : t('crew.suspendedHint')}
      </p>
    </section>
  )
}
