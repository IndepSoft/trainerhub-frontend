import { useEffect, useRef } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Calendar } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { PageHeader } from '@/shared/components/PageHeader'
import { PageSkeleton } from '@/shared/components/PageSkeleton'
import { SubscriptionBadge } from '@/shared/components/SubscriptionBadge'
import { useSwipe } from '@/shared/hooks/useSwipe'
import { getInitials, getShortName } from '@/shared/lib/personName'
import { cn } from '@/shared/lib/utils'
import { PAGE_SCROLL } from '@/shared/lib/pageScroll'
import { useViewerContext } from '@/app/ViewerContext'
import { ageOf } from '@/shared/domain/entities/student'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { STUDENT_LEVEL_LABEL_KEY } from '@/shared/i18n/domainLabels'
import { useStudent } from '../hooks/useStudent'
import { useSubscriptions } from '../hooks/useSubscriptions'
import { StudentActions } from '../components/StudentActions'
import { StudentSummary } from '../components/StudentSummary'
import { StudentLoadProgression } from '../components/StudentLoadProgression'
import { StudentProgressSection } from '../components/StudentProgressSection'
import { StudentRouteSection } from '../components/StudentRouteSection'
import { StudentSubscriptionSection } from '../components/StudentSubscriptionSection'
import { StudentSessions } from '../components/StudentSessions'
import { ScheduleSessionDialog } from '../components/ScheduleSessionDialog'
import { LEVEL_BADGE } from '../libs/levelBadge'
import {
  DEFAULT_STUDENT_SECTION,
  SCHEDULE_PARAM,
  SECTION_PARAM,
  STUDENT_SECTIONS,
  STUDENT_SECTION_LABEL_KEY,
  isStudentSection,
  type StudentSection,
} from '../libs/studentSections'

/** Las insignias de la cabecera: el mismo trazo que las del resto del sistema. */
const HERO_PILL =
  'inline-flex h-6 items-center rounded-action border px-2.5 text-[10px] font-bold uppercase tracking-[0.1em]'

/**
 * Ficha de un estudiante. Sólo composición.
 *
 * EN SECCIONES, no en una página. Era una sola columna de más de cuatro mil
 * píxeles con todo abierto —cifras, objetivos, cuota, progreso, ruta, cargas,
 * asignaciones y sesiones— y lo que se venía a mirar había que encontrarlo
 * desplazando. Ahora la cabecera dice quién es y en qué estado está, y debajo
 * hay cuatro secciones fijas: el resumen, que responde lo primero que se
 * pregunta, y el detalle de progreso, sesiones y cuota.
 */
export default function StudentDetail() {
  const { t } = useTranslation()
  const { can } = useViewerContext()
  const { studentId } = useParams<{ studentId: string }>()
  const { student, loading } = useStudent(studentId)
  const { standingOf, loading: loadingDues } = useSubscriptions()
  const scrollerRef = useRef<HTMLDivElement>(null)

  /*
   * La sección y el diálogo de agendar viven en la dirección. Así el «Le toca»
   * del resumen lleva a cada sección con un enlace normal, `?agendar` abre el
   * diálogo al entrar, y recargar deja la ficha donde estaba.
   *
   * `replace` en todos los cambios: volver tiene que salir de la ficha, no
   * recorrer sus secciones ni reabrir un diálogo ya cerrado.
   */
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedSection = searchParams.get(SECTION_PARAM)
  const activeSection: StudentSection = isStudentSection(requestedSection)
    ? requestedSection
    : DEFAULT_STUDENT_SECTION
  const isScheduleOpen = searchParams.has(SCHEDULE_PARAM)

  const selectSection = (section: StudentSection) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (section === DEFAULT_STUDENT_SECTION) next.delete(SECTION_PARAM)
        else next.set(SECTION_PARAM, section)
        return next
      },
      { replace: true }
    )
  }

  const setScheduleOpen = (open: boolean) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (open) next.set(SCHEDULE_PARAM, '')
        else next.delete(SCHEDULE_PARAM)
        return next
      },
      { replace: true }
    )
  }

  const moveSection = (offset: number) => {
    const next = STUDENT_SECTIONS.indexOf(activeSection) + offset
    // Sin envolver por los extremos, como en Entrenamientos.
    if (next < 0 || next >= STUDENT_SECTIONS.length) return
    selectSection(STUDENT_SECTIONS[next])
  }

  const { handlers: swipeHandlers } = useSwipe({
    onSwipeLeft: () => moveSection(1),
    onSwipeRight: () => moveSection(-1),
  })

  // Cada sección empieza por arriba. El contenedor que desplaza es el mismo
  // para las cuatro, y sin esto la cuota se abría a la altura en que se dejó
  // el resumen.
  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: 0 })
  }, [activeSection])

  /*
   * «Cargando» y «no existe» son estados distintos y hay que distinguirlos.
   * En el primer renderizado `student` es null porque la promesa no ha
   * resuelto; sin esta guarda, la ficha enseñaba «Estudiante no encontrado»
   * durante un instante en CADA visita.
   */
  if (loading) {
    return <PageSkeleton />
  }

  if (!student) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-bone px-6 text-center">
        <p className="font-display text-2xl font-extrabold uppercase text-ink">
          {t('students.notFound')}
        </p>
        <p className="text-sm text-ink/50">{t('students.notFoundHint')}</p>
        <Button asChild variant="outline">
          <Link to="/students">{t('students.backToStudents')}</Link>
        </Button>
      </div>
    )
  }

  const fullName = getShortName(student.firstName, student.lastName)
  const initials = getInitials(student.firstName, student.lastName)
  const age = ageOf(student.birthDate)
  const standing = standingOf(student.id)
  const duesClaim = !loadingDues && (standing.state === 'overdue' || standing.state === 'dueSoon')

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      <PageHeader className="pb-2 md:pb-3">
        {/* Enlace de vuelta explicito y no solo el gesto del sistema: en una PWA
            instalada no hay barra del navegador con boton de atras. */}
        <Link
          to="/students"
          className="-ms-2 mb-1 inline-flex h-11 items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/45 transition-colors hover:text-cobalt"
        >
          <ArrowLeft className="size-4" />
          {t('students.title')}
        </Link>

        <PageHeader.Content
          leading={
            <Avatar className="size-14">
              <AvatarImage src={student.photoUrl} alt={fullName} />
              <AvatarFallback className="bg-cobalt-tint-2 text-cobalt">{initials}</AvatarFallback>
            </Avatar>
          }
        >
          <PageHeader.Eyebrow>{student.email}</PageHeader.Eyebrow>
          <PageHeader.Title className="text-3xl">{fullName}</PageHeader.Title>

          <PageHeader.Actions>
            {/* Editar, dar de baja y eliminar. Ver `StudentActions`. */}
            <StudentActions student={student} />
            <PageHeader.PrimaryAction
              icon={Calendar}
              label={t('studentCard.scheduleSession')}
              shortLabel={t('studentCard.scheduleSessionShort')}
              onClick={() => setScheduleOpen(true)}
            />
          </PageHeader.Actions>
        </PageHeader.Content>

        {/*
          QUIÉN ES, EN UNA LÍNEA: nivel, edad y la cuota si reclama algo. Son
          datos que antes estaban repartidos por la página —el nivel era una de
          tres cifras gigantes— y aquí se leen sin entrar en ninguna sección.

          «Sin cuenta» y su invitación NO van aquí: son un pendiente, y están
          en el «Le toca» del resumen. En la cabecera partían la línea en dos y
          bajaban el contenido 50 px en todas las secciones.
        */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className={cn(HERO_PILL, LEVEL_BADGE[student.level])}>
            {t(STUDENT_LEVEL_LABEL_KEY[student.level])}
          </span>
          {age !== null && (
            <span className={cn(HERO_PILL, 'border-ink/25 text-ink/60')}>
              {t('studentDetail.age', { age })}
            </span>
          )}
          {duesClaim && (
            <SubscriptionBadge
              standing={standing}
              label={
                standing.state === 'overdue'
                  ? t('studentDetail.duesOverdue')
                  : t('studentDetail.duesSoon')
              }
              className="h-6 py-0"
            />
          )}
        </div>
      </PageHeader>

      <Tabs
        value={activeSection}
        onValueChange={(value) => {
          if (isStudentSection(value)) selectSection(value)
        }}
        className="min-h-0 flex-1 gap-0"
      >
        {/* Las secciones, FIJAS bajo la cabecera: quedan fuera del contenedor
            que desplaza, así que cambiar de sección no obliga a volver arriba. */}
        <div className="shrink-0 px-5 pb-3">
          <TabsList aria-label={t('studentSection.label')} className="w-full md:max-w-md">
            {STUDENT_SECTIONS.map((section) => (
              <TabsTrigger key={section} value={section} className="px-2 text-[13px] font-semibold">
                {t(STUDENT_SECTION_LABEL_KEY[section])}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Contenedor de scroll de la pagina. Un div y no un <main>: el
            landmark ya lo pinta SidebarInset desde RootLayout. */}
        <div ref={scrollerRef} className={PAGE_SCROLL} {...swipeHandlers}>
          <TabsContent value="resumen">
            <StudentSummary student={student} />
          </TabsContent>

          <TabsContent value="progreso">
            <StudentProgressSection studentId={student.id} />

            {/* La ruta y las validaciones son decisiones de quien gestiona: a
                quien no, la base le diria «forbidden» en cada boton. */}
            {can('students.manage') && <StudentRouteSection studentId={student.id} />}

            {/* Debajo del progreso y no dentro: aquello es el juego -nivel,
                racha, hitos- y esto es la medida de fuerza. Se leen por
                motivos distintos. */}
            <StudentLoadProgression studentId={student.id} />
          </TabsContent>

          <TabsContent value="sesiones">
            <StudentSessions student={student} />
          </TabsContent>

          <TabsContent value="cuota">
            <StudentSubscriptionSection student={student} />
          </TabsContent>
        </div>
      </Tabs>

      <ScheduleSessionDialog student={student} open={isScheduleOpen} onOpenChange={setScheduleOpen} />
    </div>
  )
}
