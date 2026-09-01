import { Link } from 'react-router-dom'
import { Check, Plus, UserPlus, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/components/PageHeader'
import { getInitials, getShortName } from '@/shared/lib/personName'
import { useViewerContext } from '@/app/ViewerContext'
import { useCrewEditor } from '../hooks/useCrewEditor'
import { useCrewMembers } from '../hooks/useCrewMembers'
import { CrewInviteCard } from '../components/CrewInviteCard'
import { SubscriptionNotice } from '../components/SubscriptionNotice'
import { CrewWall } from '../components/CrewWall'
import { CrewRanking } from '../components/CrewRanking'
import { canEnrollMembers } from '@/shared/domain/entities/crew'
import type { Student } from '@/shared/domain/entities/student'

/**
 * La página del equipo. Sólo composición.
 *
 * Es a donde lleva el nombre del crew de la barra lateral.
 *
 * EL ORDEN ES POR URGENCIA, no por importancia. Primero lo que espera una
 * decisión —las solicitudes—, después lo que se viene a mirar —el muro, y el
 * ranking—, y al final lo que se consulta de vez en cuando: el padrón y el QR.
 * Sin solicitudes pendientes, lo primero que se ve es el muro, que es lo que
 * hace que alguien vuelva a esta pantalla.
 *
 * UNA SOLA COLUMNA QUE SE DESPLAZA, sin pestañas. Cuatro secciones invitan a
 * ponerlas, y esconderían justo lo que se viene a ver: un anuncio nuevo detrás
 * de una pestaña es un anuncio que nadie lee.
 *
 * TODO: faltan los eventos. Los entrenamientos grupales NO son una entidad
 * nueva —`Session` ya tiene `kind: 'group'`—; un evento, una carrera o una
 * quedada, sí lo es.
 */
export default function CrewPage() {
  const { active, trainer, loading: loadingViewer } = useViewerContext()
  const { members, pending, loading, approve, reject } = useCrewMembers()
  const { rotateJoinToken, saving } = useCrewEditor()

  if (loadingViewer) return null

  // Sin crew no hay página que pintar: se ofrece la salida en vez de un vacío.
  if (active === null) return <NoCrew />

  const { crew, role } = active
  const isTrainer = role === 'trainer'

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      <PageHeader>
        <PageHeader.Content>
          <div className="min-w-0">
            <PageHeader.Eyebrow>
              {crew.denomination} · {members.length} {members.length === 1 ? 'miembro' : 'miembros'}
            </PageHeader.Eyebrow>
            <PageHeader.Title>{crew.name}</PageHeader.Title>
          </div>

          {isTrainer && (
            <PageHeader.Actions>
              <Button asChild variant="outline" className="gap-2">
                <Link to="/students">
                  <UserPlus className="size-4" />
                  Gestionar alumnos
                </Link>
              </Button>
            </PageHeader.Actions>
          )}
        </PageHeader.Content>
      </PageHeader>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl space-y-8 px-5 py-6">
          {/* Lo que pide una decisión va primero: es lo único de esta pantalla
              que se queda parado esperando al entrenador. */}
          {isTrainer && pending.length > 0 && (
            <section className="space-y-3" aria-labelledby="solicitudes-titulo">
              <h2
                id="solicitudes-titulo"
                className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60"
              >
                Solicitudes · {pending.length}
              </h2>

              <ul className="divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3">
                {pending.map((student) => (
                  <li key={student.id} className="flex items-center gap-3 py-3">
                    <MemberAvatar student={student} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">
                        {getShortName(student.firstName, student.lastName)}
                      </p>
                      <p className="truncate text-xs text-ink/45">{student.email}</p>
                    </div>

                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        aria-label={`Aceptar a ${getShortName(student.firstName, student.lastName)}`}
                        onClick={() => void approve(student.id)}
                        className="inline-flex size-11 items-center justify-center rounded-action text-cobalt transition-colors hover:bg-cobalt-tint"
                      >
                        <Check className="size-5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Rechazar a ${getShortName(student.firstName, student.lastName)}`}
                        onClick={() => void reject(student.id)}
                        className="inline-flex size-11 items-center justify-center rounded-action text-ink/35 transition-colors hover:text-danger"
                      >
                        <X className="size-5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Se firma con el nombre de quien entrena el equipo. Si su ficha
              no está —cuenta sin perfil—, con el nombre del propio equipo: un
              anuncio sin autor se lee como un aviso del sistema. */}
          <CrewWall
            isTrainer={isTrainer}
            authorName={
              trainer === null ? crew.name : `${trainer.firstName} ${trainer.lastName}`
            }
          />

          {/* El equipo puede apagarlo: en un grupo de rehabilitación o de salud
              general, comparar públicamente el esfuerzo hace daño. */}
          {crew.rankingEnabled && (
            <CrewRanking viewerStudentId={active.student?.id ?? null} />
          )}

          <section className="space-y-3" aria-labelledby="miembros-titulo">
            <h2
              id="miembros-titulo"
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60"
            >
              Miembros
            </h2>

            {!loading && members.length === 0 ? (
              <p className="py-8 text-sm text-ink/45">
                Todavía no entrena nadie aquí. Enseña el QR de abajo para que se
                unan.
              </p>
            ) : (
              <ul className="divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3">
                {members.map((student) => (
                  <li key={student.id} className="flex items-center gap-3 py-3">
                    <MemberAvatar student={student} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">
                        {getShortName(student.firstName, student.lastName)}
                      </p>
                      <p className="truncate text-xs text-ink/45">{student.level}</p>
                    </div>

                    {/*
                      «Sin cuenta» es una nota al margen, no un grupo aparte.
                      Quien tiene ficha ya entrena aquí y se le agenda igual; lo
                      único que le falta es poder entrar a ver su progreso. Estos
                      cuatro estaban en su propia sección, y la lista de miembros
                      salia vacia al lado.
                    */}
                    {student.profileId === null && (
                      <span className="shrink-0 rounded-action border border-cobalt-tint-3 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/40">
                        Sin cuenta
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/*
            El QR sólo lo enseña quien entrena -es la llave del equipo- y sólo
            con la suscripción activa. Sin ella no se esconde: se explica, que
            es la diferencia entre una puerta cerrada y una pared.
          */}
          {isTrainer &&
            (canEnrollMembers(crew) ? (
              <CrewInviteCard
                crew={crew}
                rotating={saving}
                onRotate={async () => {
                  await rotateJoinToken(crew.id)
                }}
              />
            ) : (
              <SubscriptionNotice status={crew.subscriptionStatus} />
            ))}
        </div>
      </div>
    </div>
  )
}

function MemberAvatar({ student }: { student: Student }) {
  return (
    <Avatar className="size-10 shrink-0">
      <AvatarImage src={student.photoUrl} alt="" />
      <AvatarFallback className="bg-cobalt-tint-2 text-xs text-cobalt">
        {getInitials(student.firstName, student.lastName)}
      </AvatarFallback>
    </Avatar>
  )
}

/**
 * Qué se ve sin pertenecer a ningún equipo.
 *
 * Las dos salidas, y no una: quien llega aquí puede ser un entrenador que aún no
 * ha creado el suyo o un alumno al que tienen que invitar. Ofrecer sólo una de
 * las dos deja a la mitad de la gente sin camino.
 */
function NoCrew() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-bone px-6 text-center">
      <h1 className="font-display text-3xl font-extrabold uppercase leading-none tracking-tight text-ink">
        Todavía no tienes equipo
      </h1>
      <p className="max-w-sm text-sm text-ink/55">
        Tus alumnos, tus rutinas y tu agenda pertenecen a un equipo. Crea el tuyo,
        o únete al de tu entrenador con su código.
      </p>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <Button asChild className="gap-2">
          <Link to="/crew/nuevo">
            <Plus className="size-4" />
            Crear un equipo
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/crew/unirse">Tengo un código</Link>
        </Button>
      </div>
    </div>
  )
}
