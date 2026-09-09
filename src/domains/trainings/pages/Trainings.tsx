import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Library, Plus } from 'lucide-react'
import {
  EMPTY_ROUTINE_FILTERS,
  filterRoutines,
  type RoutineFilterState,
} from '../libs/filterRoutines'
import { Button } from '@/shared/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { PageHeader } from '@/shared/components/PageHeader'
import { useSwipe } from '@/shared/hooks/useSwipe'
import { RoutineCard } from '../components/RoutineCard'
import { PlanCard } from '../components/PlanCard'
import { TrainingFilters } from '../components/TrainingFilters'
import { useRoutines } from '../hooks/useRoutines'
import { usePlans } from '../hooks/usePlans'
import type { Routine } from '../types/training.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'

/**
 * Orden de las pestañas, junto a los `TabsTrigger` para que añadir una no
 * obligue a acordarse de tocar dos sitios.
 *
 * Los planes van tras las rutinas porque son el nivel de arriba: una rutina es
 * una sesión y un plan es el mesociclo que las ordena. Desafíos y rachas
 * cierran, que es lo que todavía no existe.
 *
 * Ya no hay pestaña de plantillas. La marca `isTemplate` no gobernaba nada y,
 * con ninguna rutina asignada a ningún estudiante, todas eran igualmente
 * plantillas: la pestaña separaba una colección de sí misma.
 */
const TAB_ORDER = ['rutinas', 'planes'] as const
type TabValue = (typeof TAB_ORDER)[number]

/**
 * La pestaña activa vive en la URL, no en el estado del componente.
 *
 * Así `/trainings?tab=planes` es enlazable, que es lo que permite que al guardar
 * un plan se vuelva a la lista de planes y no a la de rutinas: antes se creaba
 * un plan y el usuario aterrizaba donde no podía verlo.
 */
function isTabValue(value: string | null): value is TabValue {
  return TAB_ORDER.some((tab) => tab === value)
}

interface PrimaryAction {
  labelKey: TranslationKey
  to: string
}

/**
 * La acción primaria sigue a la pestaña: en Planes crea un plan, y en el resto
 * crea una rutina.
 *
 */
const PRIMARY_ACTION: Record<TabValue, PrimaryAction> = {
  rutinas: { labelKey: 'trainings.newRoutine', to: '/trainings/new' },
  planes: { labelKey: 'trainings.newPlan', to: '/trainings/plans/new' },
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
  const { routines } = useRoutines()
  const { plans } = usePlans()
  const [searchParams, setSearchParams] = useSearchParams()

  const requestedTab = searchParams.get('tab')
  const activeTab: TabValue = isTabValue(requestedTab) ? requestedTab : 'rutinas'

  // `replace` para que cambiar de pestaña no llene el historial: el boton de
  // volver debe salir de Entrenamientos, no recorrer las cuatro pestañas.
  const setActiveTab = (tab: TabValue) => setSearchParams({ tab }, { replace: true })

  const moveTab = (offset: number) => {
    const next = TAB_ORDER.indexOf(activeTab) + offset
    // Sin envolver por los extremos: en la ultima, deslizar a la izquierda no
    // debe devolver a la primera.
    if (next < 0 || next >= TAB_ORDER.length) return
    setActiveTab(TAB_ORDER[next])
  }

  const { handlers: swipeHandlers } = useSwipe({
    onSwipeLeft: () => moveTab(1),
    onSwipeRight: () => moveTab(-1),
  })

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-bone">
      <PageHeader>
        <PageHeader.Content>
          <div>
            <PageHeader.Eyebrow>{t('trainings.eyebrow')}</PageHeader.Eyebrow>
            <PageHeader.Title>{t('trainings.title')}</PageHeader.Title>
          </div>
          <PageHeader.Actions>
            {/* El catalogo es secundario y va en `outline`: se entra a el de vez
                en cuando -para dar de alta un ejercicio que falta-, mientras que
                crear una rutina es lo que se hace a diario. */}
            <Button asChild variant="outline" className="gap-2">
              <Link to="/trainings/catalog">
                <Library className="h-4 w-4" />
                {t('trainings.catalog')}
              </Link>
            </Button>
            <Button asChild className="gap-2">
              <Link to={PRIMARY_ACTION[activeTab].to}>
                <Plus className="h-4 w-4" />
                {t(PRIMARY_ACTION[activeTab].labelKey)}
              </Link>
            </Button>
          </PageHeader.Actions>
        </PageHeader.Content>
      </PageHeader>

      <div className="flex-1 overflow-auto">
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            if (isTabValue(value)) setActiveTab(value)
          }}
          {...swipeHandlers}
        >
          <div className="px-4 pt-1">
            <TabsList className="w-full md:grid md:grid-cols-2">
              {/* Los contadores salen del dato: antes estaban escritos a mano y
                  mentian. */}
              <TabsTrigger value="rutinas">
                {t('trainings.tab.routines', { count: routines.length })}
              </TabsTrigger>
              <TabsTrigger value="planes">
                {t('trainings.tab.plans', { count: plans.length })}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Cada pestaña pinta lo suyo. Antes el control cambiaba de estado
              pero no habia `TabsContent`, asi que la lista era SIEMPRE la
              misma. */}
          <TabsContent value="rutinas" className="mt-4">
            <RoutineList routines={routines} emptyLabel={t('trainings.noRoutines')} />
          </TabsContent>

          {/*
            Los planes estaban modelados y eran inalcanzables: `usePlans`,
            `plansMock`, los objetivos y las divisiones no los importaba nadie.
            Un modelo que no se ve es indistinguible de un modelo que no existe,
            y borrarlo habria sido tirar el trabajo de ayer.
          */}
          <TabsContent value="planes" className="mt-4">
            {plans.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-ink/40">
                {t('trainings.noPlans')}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 px-4 pb-4 lg:grid-cols-2 xl:grid-cols-3">
                {plans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            )}
          </TabsContent>

          {/*
            Desafios y rachas YA NO TIENEN PESTAÑA. La tuvieron con un cartel de
            «proximamente» y era una puerta pintada en la pared: dos de las
            cuatro pestañas de la seccion no llevaban a nada. Volveran cuando
            exista el flujo de asignacion, con contenido y no con un cartel.
          */}
        </Tabs>
      </div>
    </div>
  )
}

interface RoutineListProps {
  routines: Routine[]
  emptyLabel: string
}

/**
 * Lista de rutinas con su fila de filtros.
 *
 * Los filtros sólo acompañan a las rutinas: filtrar por nivel o duración no
 * significa nada en desafíos ni en rachas, y dejarlos ahí sugeriría que hacen
 * algo.
 */
function RoutineList({ routines, emptyLabel }: RoutineListProps) {
  const { t } = useTranslation()
  const [filters, setFilters] = useState<RoutineFilterState>(EMPTY_ROUTINE_FILTERS)
  const visibleRoutines = filterRoutines(routines, filters)

  if (routines.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-ink/40">{emptyLabel}</p>
  }

  return (
    <>
      <div className="px-4 pb-4">
        <TrainingFilters filters={filters} onChange={setFilters} />
      </div>
      {/* Rejilla y no <ul>: `RoutineCard` es un <article>, y `<ul><article>` es
          HTML invalido -los hijos de una lista tienen que ser <li>-. */}
      <div className="grid grid-cols-1 gap-4 px-4 pb-4 lg:grid-cols-2 xl:grid-cols-3">
        {visibleRoutines.map((routine) => (
          <RoutineCard key={routine.id} routine={routine} />
        ))}
      </div>
      {visibleRoutines.length === 0 && (
        <p className="px-4 py-10 text-center text-sm text-ink/40">{t('trainings.noMatches')}</p>
      )}
    </>
  )
}
