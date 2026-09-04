import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'
import { usePlatformCrews } from '../hooks/usePlatformCrews'
import type { CrewOverview } from '@/shared/domain/ports/PlatformRepository'
import type { SubscriptionStatus } from '@/shared/domain/entities/crew'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'

const STATUS_LABEL_KEY: Record<SubscriptionStatus, TranslationKey> = {
  pending: 'subscription.pending',
  active: 'subscription.active',
  suspended: 'subscription.suspended',
}

/**
 * Cada estado con su color, y el pendiente en Ember.
 *
 * El naranja está reservado en este sistema para lo que reclama atención, y una
 * suscripción pendiente es exactamente eso: alguien esperando a que se le abra
 * la puerta. La suspendida va en rojo porque es una decisión tomada, no una
 * tarea; y la activa en gris, porque no pide nada.
 */
const STATUS_BADGE: Record<SubscriptionStatus, string> = {
  pending: 'border-ember/40 bg-ember/10 text-ember-deep',
  active: 'border-cobalt-tint-3 text-ink/45',
  suspended: 'border-danger/40 bg-danger/5 text-danger',
}

/**
 * Los equipos de la plataforma y su suscripción.
 *
 * ES LA LLAVE DEL PRODUCTO: un equipo nace sin poder incorporar a nadie —ni QR
 * ni alta de fichas— y desde aquí se le abre. Todo lo demás lo puede hacer su
 * entrenador desde el primer minuto, porque es trabajo suyo que no ve nadie más.
 */
export function PlatformCrews() {
  const { t } = useTranslation()
  const { crews, loading, setSubscription } = usePlatformCrews()

  const waiting = crews.filter((entry) => entry.crew.subscriptionStatus === 'pending')
  const rest = crews.filter((entry) => entry.crew.subscriptionStatus !== 'pending')

  return (
    <div className="space-y-8">
      {loading ? null : (
        <>
          {/* Lo que espera una decisión va primero y separado: es lo único de
              esta pantalla que se queda parado esperando a alguien. */}
          <CrewSection
            title={t('platform.crews.waiting', { count: waiting.length })}
            crews={waiting}
            emptyMessage={t('platform.crews.waitingEmpty')}
            onSetSubscription={setSubscription}
          />

          <CrewSection
            title={t('platform.crews.rest')}
            crews={rest}
            emptyMessage={t('platform.crews.restEmpty')}
            onSetSubscription={setSubscription}
          />
        </>
      )}
    </div>
  )
}

interface CrewSectionProps {
  title: string
  crews: CrewOverview[]
  emptyMessage: string
  onSetSubscription: (crewId: string, status: SubscriptionStatus) => Promise<void>
}

function CrewSection({ title, crews, emptyMessage, onSetSubscription }: CrewSectionProps) {
  const { t, plural } = useTranslation()

  return (
    <section className="space-y-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
        {title}
      </h2>

      {crews.length === 0 ? (
        <p className="py-6 text-sm text-ink/45">{emptyMessage}</p>
      ) : (
        <ul className="divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3">
          {/*
            En movil la fila SE APILA. A 375 px, nombre, insignia y boton en una
            linea dejaban el subtitulo en «Marco Salas · 4 miem…»: el dato que
            dice si el equipo es real se perdia por tres pixeles.
          */}
          {crews.map((entry) => (
            <li
              key={entry.crew.id}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{entry.crew.name}</p>
                <p className="truncate text-xs text-ink/45">
                  {/* Sin dueño identificable se dice, en vez de dejar el hueco:
                      un equipo cuyo entrenador ya no tiene ficha es raro y
                      merece verse. */}
                  {entry.ownerName ?? t('platform.crews.noOwner')} ·{' '}
                  {plural(
                    'platform.crews.memberCount.one',
                    'platform.crews.memberCount.other',
                    entry.memberCount,
                    { count: entry.memberCount }
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'shrink-0 rounded-action border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]',
                    STATUS_BADGE[entry.crew.subscriptionStatus]
                  )}
                >
                  {t(STATUS_LABEL_KEY[entry.crew.subscriptionStatus])}
                </span>

                {entry.crew.subscriptionStatus === 'active' ? (
                  <Button
                    variant="outline"
                    className="ms-auto shrink-0 sm:ms-0"
                    onClick={() => void onSetSubscription(entry.crew.id, 'suspended')}
                  >
                    {t('platform.crews.suspend')}
                  </Button>
                ) : (
                  <Button
                    className="ms-auto shrink-0 sm:ms-0"
                    onClick={() => void onSetSubscription(entry.crew.id, 'active')}
                  >
                    {t('platform.crews.activate')}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
