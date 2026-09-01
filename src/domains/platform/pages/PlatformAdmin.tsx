import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/components/PageHeader'
import { cn } from '@/shared/lib/utils'
import { useViewerContext } from '@/app/ViewerContext'
import { usePlatformCrews } from '../hooks/usePlatformCrews'
import type { CrewOverview } from '@/shared/domain/ports/PlatformRepository'
import type { SubscriptionStatus } from '@/shared/domain/entities/crew'

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  pending: 'Pendiente',
  active: 'Activa',
  suspended: 'Suspendida',
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
 * El panel de la plataforma. Sólo composición.
 *
 * ES LA LLAVE DEL PRODUCTO: un equipo nace sin poder incorporar a nadie —ni QR
 * ni alta de fichas— y desde aquí se le abre. Todo lo demás lo puede hacer su
 * entrenador desde el primer minuto, porque es trabajo suyo que no ve nadie más.
 *
 * ESCONDER ESTA PANTALLA NO ES LA SEGURIDAD. La ruta comprueba quién entra, y
 * eso evita que se muestre por error; lo que impide de verdad que alguien active
 * su propio equipo es la política del servidor, que todavía no existe. Está
 * anotado en `PlatformRepository`.
 */
export default function PlatformAdmin() {
  const { isPlatformAdmin, loading: loadingViewer } = useViewerContext()
  const { crews, loading, setSubscription } = usePlatformCrews()

  if (loadingViewer) return null
  if (!isPlatformAdmin) return <NotAllowed />

  const waiting = crews.filter((entry) => entry.crew.subscriptionStatus === 'pending')
  const rest = crews.filter((entry) => entry.crew.subscriptionStatus !== 'pending')

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      <PageHeader>
        <PageHeader.Content>
          <div className="min-w-0">
            <PageHeader.Eyebrow>
              {loading
                ? 'Plataforma'
                : `Plataforma · ${crews.length} ${crews.length === 1 ? 'equipo' : 'equipos'}`}
            </PageHeader.Eyebrow>
            <PageHeader.Title>Suscripciones</PageHeader.Title>
          </div>
        </PageHeader.Content>
      </PageHeader>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl space-y-8 px-5 py-6">
          {/* Lo que espera una decisión va primero y separado: es lo único de
              esta pantalla que se queda parado esperando a alguien. */}
          <CrewSection
            title={`Esperando activación · ${waiting.length}`}
            crews={waiting}
            emptyMessage="No hay equipos esperando. Los que se creen aparecerán aquí."
            onSetSubscription={setSubscription}
          />

          <CrewSection
            title="El resto"
            crews={rest}
            emptyMessage="Todavía no hay ningún equipo activo."
            onSetSubscription={setSubscription}
          />
        </div>
      </div>
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
                  {entry.ownerName ?? 'Sin entrenador'} · {entry.memberCount}{' '}
                  {entry.memberCount === 1 ? 'miembro' : 'miembros'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'shrink-0 rounded-action border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]',
                    STATUS_BADGE[entry.crew.subscriptionStatus]
                  )}
                >
                  {STATUS_LABEL[entry.crew.subscriptionStatus]}
                </span>

                {entry.crew.subscriptionStatus === 'active' ? (
                  <Button
                    variant="outline"
                    className="ms-auto shrink-0 sm:ms-0"
                    onClick={() => void onSetSubscription(entry.crew.id, 'suspended')}
                  >
                    Suspender
                  </Button>
                ) : (
                  <Button
                    className="ms-auto shrink-0 sm:ms-0"
                    onClick={() => void onSetSubscription(entry.crew.id, 'active')}
                  >
                    Activar
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

/**
 * Qué ve quien llega aquí sin ser administrador.
 *
 * Se dice que no le corresponde, en vez de fingir que la ruta no existe. Un 404
 * sería más discreto y aquí no compra nada: quien escribe `/admin` a mano ya
 * sabe que existe, y al resto no se le ofrece el enlace.
 */
function NotAllowed() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-bone px-6 text-center">
      <h1 className="font-display text-3xl font-extrabold uppercase leading-none tracking-tight text-ink">
        Esto no es para ti
      </h1>
      <p className="max-w-sm text-sm text-ink/55">
        El panel de la plataforma sólo lo abre quien la administra.
      </p>
      <Button asChild variant="outline">
        <Link to="/">Volver</Link>
      </Button>
    </div>
  )
}
