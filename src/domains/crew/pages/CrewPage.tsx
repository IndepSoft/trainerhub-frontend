import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Check, Plus, Settings, UserPlus, Users, X } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { ListRow } from '@/shared/components/ListRow'
import { useSwipe } from '@/shared/hooks/useSwipe'
import { useUrlSection } from '@/shared/hooks/useUrlSection'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'
import { toast } from 'sonner'
import { describeError } from '@/shared/i18n/errorMessages'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/components/PageHeader'
import { getInitials, getShortName } from '@/shared/lib/personName'
import { useViewerContext } from '@/app/ViewerContext'
import { useCrewEditor } from '../hooks/useCrewEditor'
import { useCrewMembers } from '../hooks/useCrewMembers'
import { CrewInviteCard } from '../components/CrewInviteCard'
import { CopyInviteButton } from '@/shared/components/CopyInviteButton'
import { SubscriptionNotice } from '../components/SubscriptionNotice'
import { CrewWall } from '../components/CrewWall'
import { CrewRanking } from '../components/CrewRanking'
import { canEnrollMembers } from '@/shared/domain/entities/crew'
import type { Membership } from '@/shared/domain/entities/crew'
import { cohortOf } from '@/shared/domain/entities/progress'
import type { Student } from '@/shared/domain/entities/student'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { STUDENT_LEVEL_LABEL_KEY } from '@/shared/i18n/domainLabels'
import { PAGE_SCROLL } from '@/shared/lib/pageScroll'

/** Las secciones del equipo, en el orden en que se miran. */
const CREW_SECTIONS = ['muro', 'miembros', 'ranking', 'invitar'] as const
type CrewSection = (typeof CREW_SECTIONS)[number]

const CREW_SECTION_LABEL_KEY: Record<CrewSection, TranslationKey> = {
  muro: 'crew.wall',
  miembros: 'crew.members',
  ranking: 'crew.ranking',
  invitar: 'crew.inviteSection',
}

/**
 * La página del equipo. Sólo composición.
 *
 * Es a donde lleva el nombre del crew de la barra lateral.
 *
 * EN SECCIONES, y antes no: muro, miembros, solicitudes, ranking y QR iban
 * seguidos en una columna de 1.920 px, y la lista de miembros salía dos veces
 * —como miembros y como ranking—.
 *
 * LA OBJECIÓN DE ENTONCES ERA BUENA y por eso el muro es la PRIMERA sección:
 * «un anuncio nuevo detrás de una pestaña es un anuncio que nadie lee», así que
 * el muro es lo que se ve al entrar y ninguna pestaña lo tapa. Lo que sí se
 * quedaba esperando una decisión —las solicitudes— viaja a «Miembros» con su
 * cuenta en la pestaña, además de contar en la bandeja del panel y en la barra:
 * esconderlo sin avisar habría sido el mismo error al revés.
 *
 * TODO: faltan los eventos. Los entrenamientos grupales NO son una entidad
 * nueva —`Session` ya tiene `kind: 'group'`—; un evento, una carrera o una
 * quedada, sí lo es.
 */
export default function CrewPage() {
  const { active, loading: loadingViewer } = useViewerContext()

  if (loadingViewer) return null

  // Sin crew no hay página que pintar: se ofrece la salida en vez de un vacío.
  if (active === null) return <NoCrew />

  /*
   * EL TABLERO VA EN SU PROPIO COMPONENTE, y no aquí mismo, porque QUÉ
   * SECCIONES EXISTEN depende del equipo —el ranking se puede apagar, el QR
   * sólo lo ve quien invita— y los hooks que las manejan —la sección de la
   * dirección, el deslizamiento, el desplazamiento— no pueden vivir detrás de
   * los dos `return` de arriba.
   */
  return <CrewBoard membership={active} />
}

interface CrewBoardProps {
  membership: Membership
}

/** El equipo, ya resuelto: cabecera fija y las secciones debajo. */
function CrewBoard({ membership }: CrewBoardProps) {
  const { crew, role, student: viewerStudent } = membership
  const { t, plural } = useTranslation()
  const { trainer, can } = useViewerContext()
  const { members, pending, loading, approve, reject } = useCrewMembers()
  const { rotateJoinToken, requestActivation, saving, error: editorError } = useCrewEditor()
  const scrollerRef = useRef<HTMLDivElement>(null)

  /*
   * CADA CONTROL PREGUNTA POR SU PROPIA CAPACIDAD, no por el rol.
   *
   * Con `role === 'trainer'` no cabía el gimnasio: su dueño gobierna sin
   * entrenar y sus entrenadores llevan alumnos sin tocar los ajustes. Preguntar
   * por lo que cada botón necesita deja los dos casos expresados, y deja además
   * la puerta abierta a prestarle una llave suelta a alguien.
   */
  const isStaff = role !== 'student'
  const canInvite = canEnrollMembers(crew)

  // Las que EXISTEN AHORA. Una dirección que nombre otra cae en el muro.
  const sections = CREW_SECTIONS.filter(
    (candidate) =>
      (candidate !== 'ranking' || crew.rankingEnabled) &&
      (candidate !== 'invitar' || can('crew.invite'))
  )
  const { section, select: selectSection } = useUrlSection(sections)
  const pendingCount = can('crew.members') ? pending.length : 0

  // Aceptar y rechazar se esperan y se dicen: eran dos `void` mudos.
  const decide = async (decision: () => Promise<void>) => {
    try {
      await decision()
    } catch (caught) {
      toast.error(describeError(caught, t, 'crew.memberActionError'))
    }
  }

  const moveSection = (delta: number) => {
    const next = sections.indexOf(section) + delta
    if (next < 0 || next >= sections.length) return
    selectSection(sections[next])
  }

  const { handlers: swipeHandlers } = useSwipe({
    onSwipeLeft: () => moveSection(1),
    onSwipeRight: () => moveSection(-1),
  })

  // Cada sección empieza por arriba: el contenedor que desplaza es el mismo
  // para todas, y sin esto el ranking se abría a la altura del muro.
  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: 0 })
  }, [section])

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Eyebrow>
            {crew.denomination} ·{' '}
            {plural('crew.memberCount.one', 'crew.memberCount.other', members.length, {
              count: members.length,
            })}
          </PageHeader.Eyebrow>
          <PageHeader.Title>{crew.name}</PageHeader.Title>

          {/* Los tres accesos son secundarios y ninguno primario: esta pagina
              no tiene UNA cosa que se haga a diario, se mira. En movil van en
              icono; con texto, los tres apilados se llevaban 148 px. */}
          {isStaff && (
            <PageHeader.Actions>
              {/* Cada acceso pregunta por SU capacidad, no por el rol: es lo que
                  permite prestarle una llave a alguien sin ascenderlo. */}
              {can('crew.staff') && (
                <PageHeader.SecondaryAction icon={Users} label={t('crew.staff')} to="/crew/equipo" />
              )}

              {can('crew.settings') && (
                <PageHeader.SecondaryAction
                  icon={Settings}
                  label={t('crew.settings')}
                  to="/crew/ajustes"
                />
              )}

              {can('students.manage') && (
                <PageHeader.SecondaryAction
                  icon={UserPlus}
                  label={t('crew.manageStudents')}
                  to="/students"
                />
              )}
            </PageHeader.Actions>
          )}
        </PageHeader.Content>
      </PageHeader>

      <Tabs
        value={section}
        onValueChange={(value) => {
          const chosen = sections.find((candidate) => candidate === value)
          if (chosen !== undefined) selectSection(chosen)
        }}
        className="min-h-0 flex-1 gap-0"
      >
        <div className="shrink-0 px-5 pb-3">
          <TabsList aria-label={t('crew.sectionsLabel')} className="w-full md:max-w-lg">
            {sections.map((candidate) => (
              <TabsTrigger
                key={candidate}
                value={candidate}
                className="gap-1.5 px-2 text-[13px] font-semibold"
              >
                {t(CREW_SECTION_LABEL_KEY[candidate])}
                {/* Lo que espera una decisión se anuncia en su pestaña: las
                    solicitudes, y la suscripción sin activar. */}
                {candidate === 'miembros' && pendingCount > 0 && (
                  <span
                    aria-label={t('crew.pendingWaiting', { count: pendingCount })}
                    className="metric-figures rounded-action bg-cobalt px-1.5 text-[11px] font-bold text-white"
                  >
                    {pendingCount}
                  </span>
                )}
                {candidate === 'invitar' && !canInvite && (
                  <span
                    role="img"
                    aria-label={t('crew.needsActivation')}
                    className="size-2 shrink-0 rounded-full bg-ember"
                  />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div ref={scrollerRef} className={PAGE_SCROLL} {...swipeHandlers}>
          <div className="mx-auto max-w-3xl px-5 pb-6">
            <TabsContent value="muro">
              {/* Se firma con el nombre de quien entrena el equipo. Si su ficha
                  no está —cuenta sin perfil—, con el nombre del propio equipo:
                  un anuncio sin autor se lee como un aviso del sistema. */}
              <CrewWall
                isStaff={isStaff}
                canPublish={can('crew.wall')}
                authorName={
                  trainer === null ? crew.name : `${trainer.firstName} ${trainer.lastName}`
                }
              />
            </TabsContent>

            <TabsContent value="miembros" className="flex flex-col gap-6 pt-2">
              {/* Lo que pide una decisión va primero: es lo único de esta
                  pantalla que se queda parado esperando al entrenador. */}
              {can('crew.members') && pending.length > 0 && (
                <section className="flex flex-col" aria-labelledby="solicitudes-titulo">
                  <h2
                    id="solicitudes-titulo"
                    className="border-b border-cobalt-tint-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60"
                  >
                    {t('crew.requestsHeading', { count: pending.length })}
                  </h2>

                  <ul>
                    {pending.map((student) => (
                      <ListRow
                        key={student.id}
                        primary={getShortName(student.firstName, student.lastName)}
                        secondary={student.email}
                        leading={<MemberAvatar student={student} />}
                        trailing={
                          <div className="flex shrink-0 gap-1">
                            <button
                              type="button"
                              aria-label={t('crew.acceptLabel', {
                                name: getShortName(student.firstName, student.lastName),
                              })}
                              onClick={() => void decide(() => approve(student.id))}
                              className="inline-flex size-11 items-center justify-center rounded-action text-cobalt transition-colors hover:bg-cobalt-tint"
                            >
                              <Check className="size-5" />
                            </button>
                            <button
                              type="button"
                              aria-label={t('crew.rejectLabel', {
                                name: getShortName(student.firstName, student.lastName),
                              })}
                              onClick={() => void decide(() => reject(student.id))}
                              className="inline-flex size-11 items-center justify-center rounded-action text-ink/35 transition-colors hover:text-danger"
                            >
                              <X className="size-5" />
                            </button>
                          </div>
                        }
                      />
                    ))}
                  </ul>
                </section>
              )}

              <section className="flex flex-col" aria-labelledby="miembros-titulo">
                <div className="flex items-baseline justify-between gap-2 border-b border-cobalt-tint-3 pb-2">
                  <h2
                    id="miembros-titulo"
                    className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60"
                  >
                    {t('crew.members')}
                  </h2>
                  <span className="metric-figures text-[13px] font-semibold text-cobalt">
                    {members.length}
                  </span>
                </div>

                {!loading && members.length === 0 ? (
                  <p className="py-8 text-sm text-ink/45">{t('crew.membersEmpty')}</p>
                ) : (
                  <ul>
                    {members.map((student) => (
                      <ListRow
                        key={student.id}
                        primary={getShortName(student.firstName, student.lastName)}
                        /*
                          «Sin cuenta» es una nota al margen, no un grupo aparte.
                          Quien tiene ficha ya entrena aquí y se le agenda igual;
                          lo único que le falta es poder entrar a ver su
                          progreso.
                        */
                        secondary={`${t(STUDENT_LEVEL_LABEL_KEY[student.level])} · ${
                          student.profileId === null
                            ? t('crew.noAccount')
                            : t('crew.withAccount')
                        }`}
                        leading={<MemberAvatar student={student} />}
                        trailing={
                          student.profileId === null && can('crew.invite') && canInvite ? (
                            <CopyInviteButton joinToken={crew.joinToken} />
                          ) : undefined
                        }
                      />
                    ))}
                  </ul>
                )}
              </section>
            </TabsContent>

            {/* El equipo puede apagar el ranking: en un grupo de rehabilitación
                o de salud general, comparar públicamente el esfuerzo hace daño.
                Apagado, su pestaña no existe. */}
            {crew.rankingEnabled && (
              <TabsContent value="ranking" className="pt-2">
                <CrewRanking
                  viewerStudentId={viewerStudent?.id ?? null}
                  viewerCohort={cohortOf(viewerStudent?.birthDate ?? null)}
                />
              </TabsContent>
            )}

            {/*
              El QR sólo lo enseña quien entrena -es la llave del equipo- y sólo
              con la suscripción activa. Sin ella no se esconde: se explica, que
              es la diferencia entre una puerta cerrada y una pared.
            */}
            {can('crew.invite') && (
              <TabsContent value="invitar" className="pt-2">
                {canInvite ? (
                  <CrewInviteCard
                    crew={crew}
                    rotating={saving}
                    onRotate={async () => {
                      await rotateJoinToken(crew.id)
                    }}
                  />
                ) : (
                  <SubscriptionNotice
                    crew={crew}
                    requesting={saving}
                    error={editorError}
                    onRequestActivation={() => requestActivation(crew.id)}
                  />
                )}
              </TabsContent>
            )}
          </div>
        </div>
      </Tabs>
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
  const { t } = useTranslation()
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-bone px-6 text-center">
      <h1 className="font-display text-3xl font-extrabold uppercase leading-none tracking-tight text-ink">
        {t('crew.none')}
      </h1>
      <p className="max-w-sm text-sm text-ink/55">
        {t('crew.noneHint')}
      </p>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <Button asChild className="gap-2">
          <Link to="/crew/nuevo">
            <Plus className="size-4" />
            {t('crew.create')}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/crew/unirse">{t('joinCrew.haveCode')}</Link>
        </Button>
      </div>
    </div>
  )
}
