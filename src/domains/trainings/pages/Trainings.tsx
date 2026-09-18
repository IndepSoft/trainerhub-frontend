import { useEffect, useRef, useState } from 'react'
import { Dumbbell, CalendarRange, Library, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/components/EmptyState'
import {
  EMPTY_ROUTINE_FILTERS,
  filterRoutines,
  type RoutineFilterState,
} from '../libs/filterRoutines'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { PageHeader } from '@/shared/components/PageHeader'
import { useSwipe } from '@/shared/hooks/useSwipe'
import { useUrlSection } from '@/shared/hooks/useUrlSection'
import { RoutineCard } from '../components/RoutineCard'
import { PlanCard } from '../components/PlanCard'
import { TrainingFilters } from '../components/TrainingFilters'
import { useRoutines } from '../hooks/useRoutines'
import { usePlans } from '../hooks/usePlans'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'
import { PAGE_SCROLL } from '@/shared/lib/pageScroll'

/**
 * Las secciones, en el orden en que se miran.
 *
 * Los planes van tras las rutinas porque son el nivel de arriba: una rutina es
 * una sesión y un plan es el mesociclo que las ordena.
 *
 * Ya no hay pestaña de plantillas. La marca `isTemplate` no gobernaba nada y,
 * con ninguna rutina asignada a ningún estudiante, todas eran igualmente
 * plantillas: la pestaña separaba una colección de sí misma.
 *
 * La sección vive en la dirección —`?seccion=planes`— como en la ficha y el
 * equipo (`CAMBIOS` §40 y §45): es lo que permite que al guardar un plan se
 * vuelva a la lista de planes y no a la de rutinas.
 */
const TRAINING_SECTIONS = ['rutinas', 'planes'] as const
type TrainingSection = (typeof TRAINING_SECTIONS)[number]

interface PrimaryAction {
  labelKey: TranslationKey
  /** La palabra que se ve en móvil; el nombre completo sigue en `labelKey`. */
  shortLabelKey: TranslationKey
  to: string
}

/**
 * La acción primaria sigue a la pestaña: en Planes crea un plan, y en el resto
 * crea una rutina.
 *
 */
const PRIMARY_ACTION: Record<TrainingSection, PrimaryAction> = {
  rutinas: {
    labelKey: 'trainings.newRoutine',
    shortLabelKey: 'trainings.newRoutineShort',
    to: '/trainings/new',
  },
  planes: {
    labelKey: 'trainings.newPlan',
    shortLabelKey: 'trainings.newPlanShort',
    to: '/trainings/plans/new',
  },
}

/**
 * Lo que el entrenador crea para asignar.
 *
 * Desafíos y rachas viven aquí y no en Progreso desde que se aclaró el flujo:
 * son cosas que el entrenador CREA para luego asignarlas a un estudiante, igual
 * que una rutina. En Progreso quedan los logros, que es lo que el estudiante
 * consigue.
 */
export default function Trainings() {
  const { t } = useTranslation()
  /*
   * CARGAR NO ES ESTAR VACÍO. Las dos listas nacen vacías hasta que llega la
   * respuesta, y sin distinguirlo el vacío —«Tu primera rutina»— se pintaba un
   * instante a quien tiene diez. La CI lo cazó: su máquina es más lenta y el
   * instante le daba para encontrar el enlace del vacío.
   */
  const { routines, loading: loadingRoutines } = useRoutines()
  const { plans, loading: loadingPlans } = usePlans()
  const scrollerRef = useRef<HTMLDivElement>(null)

  /*
   * EL FILTRO VIVE EN LA PÁGINA porque su fila queda FIJA bajo las pestañas:
   * se filtra mirando cómo mengua la lista, así que desplazarse no puede
   * llevárselo. Estaba dentro de la lista, y allí se iba con ella.
   */
  const [filters, setFilters] = useState<RoutineFilterState>(EMPTY_ROUTINE_FILTERS)
  const visibleRoutines = filterRoutines(routines, filters)

  const { section, select: selectSection } = useUrlSection(TRAINING_SECTIONS)

  const moveSection = (offset: number) => {
    const next = TRAINING_SECTIONS.indexOf(section) + offset
    // Sin envolver por los extremos: en la ultima, deslizar a la izquierda no
    // debe devolver a la primera.
    if (next < 0 || next >= TRAINING_SECTIONS.length) return
    selectSection(TRAINING_SECTIONS[next])
  }

  const { handlers: swipeHandlers } = useSwipe({
    onSwipeLeft: () => moveSection(1),
    onSwipeRight: () => moveSection(-1),
  })

  // Cada sección empieza por arriba: el contenedor que desplaza es el mismo.
  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: 0 })
  }, [section])

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-bone">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Eyebrow>{t('trainings.eyebrow')}</PageHeader.Eyebrow>
          <PageHeader.Title>{t('trainings.title')}</PageHeader.Title>
          <PageHeader.Actions>
            {/* El catalogo es secundario: se entra a el de vez en cuando -para
                dar de alta un ejercicio que falta-, mientras que crear una
                rutina es lo que se hace a diario. */}
            <PageHeader.SecondaryAction
              icon={Library}
              label={t('trainings.catalog')}
              to="/trainings/catalog"
            />
            <PageHeader.PrimaryAction
              icon={Plus}
              label={t(PRIMARY_ACTION[section].labelKey)}
              shortLabel={t(PRIMARY_ACTION[section].shortLabelKey)}
              to={PRIMARY_ACTION[section].to}
            />
          </PageHeader.Actions>
        </PageHeader.Content>
      </PageHeader>

      <Tabs
        value={section}
        onValueChange={(value) => {
          const chosen = TRAINING_SECTIONS.find((candidate) => candidate === value)
          if (chosen !== undefined) selectSection(chosen)
        }}
        className="min-h-0 flex-1 gap-0"
      >
        {/* Las secciones, FIJAS bajo la cabecera: quedan fuera del contenedor
            que desplaza, así que cambiar de sección no obliga a volver arriba. */}
        <div className="shrink-0 px-5 pb-3">
          <TabsList aria-label={t('trainings.sectionsLabel')} className="w-full md:max-w-md">
            {/* Los contadores salen del dato: antes estaban escritos a mano y
                mentian. */}
            <TabsTrigger value="rutinas" className="px-2 text-[13px] font-semibold">
              {t('trainings.tab.routines', { count: routines.length })}
            </TabsTrigger>
            <TabsTrigger value="planes" className="px-2 text-[13px] font-semibold">
              {t('trainings.tab.plans', { count: plans.length })}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Sólo en rutinas —filtrar por nivel no significa nada en un plan— y
            sólo si hay algo que filtrar. */}
        {section === 'rutinas' && routines.length > 0 && (
          <div className="shrink-0 px-5 pb-3">
            <TrainingFilters filters={filters} onChange={setFilters} />
          </div>
        )}

        <div ref={scrollerRef} className={PAGE_SCROLL} {...swipeHandlers}>
          {/* Cada pestaña pinta lo suyo. Antes el control cambiaba de estado
              pero no habia `TabsContent`, asi que la lista era SIEMPRE la
              misma. */}
          <TabsContent value="rutinas">
            {!loadingRoutines && routines.length === 0 && (
              <div className="px-5">
                <EmptyState
                  icon={Dumbbell}
                  title={t('trainings.noRoutinesTitle')}
                  body={t('trainings.noRoutines')}
                >
                  <Button asChild>
                    <Link to="/trainings/new">{t('trainings.newRoutine')}</Link>
                  </Button>
                  {/* De donde salen los ejercicios: sin catalogo, componer una
                      rutina ofrece una lista vacia. */}
                  <Button asChild variant="ghost" className="text-cobalt">
                    <Link to="/trainings/catalog">{t('trainings.seeCatalog')}</Link>
                  </Button>
                </EmptyState>
              </div>
            )}

            {/* Rejilla y no <ul>: `RoutineCard` es un <article>, y
                `<ul><article>` es HTML invalido -los hijos de una lista tienen
                que ser <li>-. */}
            {visibleRoutines.length > 0 && (
              <div className="grid grid-cols-1 gap-3 px-5 pb-4 lg:grid-cols-2 xl:grid-cols-3">
                {visibleRoutines.map((routine) => (
                  <RoutineCard key={routine.id} routine={routine} />
                ))}
              </div>
            )}

            {routines.length > 0 && visibleRoutines.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-ink/40">
                {t('trainings.noMatches')}
              </p>
            )}
          </TabsContent>

          {/*
            Los planes estaban modelados y eran inalcanzables: `usePlans`,
            `plansMock`, los objetivos y las divisiones no los importaba nadie.
            Un modelo que no se ve es indistinguible de un modelo que no existe,
            y borrarlo habria sido tirar el trabajo de ayer.
          */}
          <TabsContent value="planes">
            {loadingPlans ? null : plans.length === 0 ? (
              <div className="px-5">
                <EmptyState
                  icon={CalendarRange}
                  title={t('trainings.noPlansTitle')}
                  body={t('trainings.noPlans')}
                >
                  <Button asChild>
                    <Link to="/trainings/plans/new">{t('trainings.newPlan')}</Link>
                  </Button>
                </EmptyState>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 px-5 pb-4 lg:grid-cols-2 xl:grid-cols-3">
                {plans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
