import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Check, Library, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { PageHeader } from '@/shared/components/PageHeader'
import { describeError } from '@/shared/i18n/errorMessages'
import { useTrainingCatalog } from '../hooks/useTrainingCatalog'
import { useRoutine } from '../hooks/useRoutines'
import { useRoutineDraft } from '../hooks/useRoutineDraft'
import { useBlockLibrary } from '../hooks/useBlockLibrary'
import { useRoutineActions } from '../hooks/useRoutineActions'
import { canSaveBlockDraft } from '../libs/blockLibrary'
import { clearRoutineDraft } from '../libs/draftStorage'
import { BlockEditor } from '../components/BlockEditor'
import { SavedBlockPicker } from '../components/SavedBlockPicker'
import { RoutineDraftLine } from '../components/RoutineDraftLine'
import { RoutineIdentityFields } from '../components/RoutineIdentityFields'
import type { BlockDraft } from '../types/routineDraft.types'
import type { Routine } from '@/shared/domain/entities/routine'
import { activeLocale } from '@/shared/i18n/activeLocale'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import type { TranslationKey } from '@/shared/i18n/dictionaries/es'
import { cn } from '@/shared/lib/utils'
import { PAGE_SCROLL } from '@/shared/lib/pageScroll'

/**
 * Crear y editar una rutina. Sólo composición.
 *
 * UNA SOLA PÁGINA PARA LAS DOS COSAS. La ruta es la que decide: `/trainings/new`
 * no trae `routineId` y `/trainings/:routineId/edit` sí. Lo único que cambia
 * entre crear y editar es de dónde sale el borrador inicial y qué se llama al
 * guardar; todo lo demás —bloques, validación, resumen en vivo, biblioteca— es
 * idéntico, y tenerlo en dos ficheros habría sido duplicarlo entero para que se
 * separaran al primer cambio.
 *
 * Toda la página va dentro de un `<form>`, cabecera incluida, para que el botón
 * de guardar sea un `submit` de verdad: así funciona la tecla Intro y el
 * navegador anuncia el formulario como tal.
 */
export default function RoutineForm() {
  const { t } = useTranslation()
  const { routineId } = useParams<{ routineId: string }>()
  const { routine, loading } = useRoutine(routineId)

  const isEditing = routineId !== undefined

  // Mientras carga no se pinta nada. `routine === null` no significa «no
  // existe» hasta que `loading` es falso, o toda edicion parpadearia en «no
  // encontrada» antes de cargarse.
  if (isEditing && loading) return null

  if (isEditing && routine === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-bone px-6 text-center">
        <p className="font-display text-2xl font-extrabold uppercase text-ink">
          {t('routine.notFound')}
        </p>
        <p className="text-sm text-ink/60">{t('routine.notFoundHint')}</p>
        <Button asChild variant="outline">
          <Link to="/trainings">{t('routine.back')}</Link>
        </Button>
      </div>
    )
  }

  /*
   * `key` para que el borrador se inicialice CON la rutina ya cargada.
   *
   * `useRoutineDraft` toma su estado inicial una sola vez, y la rutina llega
   * despues del primer render porque el puerto es asincrono. Sin separar los
   * campos en su propio componente montado por clave, editar abriria siempre un
   * formulario vacio.
   */
  return <RoutineFormFields key={routine?.id ?? 'nueva'} routine={routine} />
}

/** Los pasos del formulario, en el orden en que se rellena. */
const FORM_STEPS = ['identity', 'blocks'] as const
type FormStep = (typeof FORM_STEPS)[number]

const FORM_STEP_LABEL_KEY: Record<FormStep, TranslationKey> = {
  identity: 'routine.step.identity',
  blocks: 'routine.step.blocks',
}

function isFormStep(value: string): value is FormStep {
  return FORM_STEPS.some((step) => step === value)
}

interface RoutineFormFieldsProps {
  /** La rutina que se edita, o `null` para dar una de alta. */
  routine: Routine | null
}

/**
 * EN DOS PASOS, no en una página de más de dos mil píxeles: primero qué es la
 * rutina, después qué lleva. Crear abre en el primero; editar, en los bloques,
 * que es lo que se viene a cambiar.
 *
 * Los dos pasos son la MISMA rutina y se guarda desde cualquiera. Por eso el
 * error de los bloques va por encima de los pasos —se ve desde los dos—, cada
 * paso con un error lleva una marca, y al intentar guardar se abre el primero
 * que falla.
 */
function RoutineFormFields({ routine }: RoutineFormFieldsProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { exercises } = useTrainingCatalog()
  const { createRoutine, updateRoutine } = useRoutineActions()

  const routineId = routine?.id
  const isEditing = routine !== null

  const {
    draft,
    errors,
    preview,
    canRemoveBlock,
    setTitle,
    setDescription,
    setLevel,
    addBlock,
    insertBlock,
    removeBlock,
    updateBlock,
    addExercise,
    removeExercise,
    updateExercise,
    submit,
    restored,
    discard,
  } = useRoutineDraft(routine)
  const { savedBlocks, saveFromDraft } = useBlockLibrary()

  const [step, setStep] = useState<FormStep>(isEditing ? 'blocks' : 'identity')
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [lastSavedName, setLastSavedName] = useState<string | null>(null)

  /*
   * Los ejercicios que había al abrir. Arrancan plegados; los que se añaden
   * después se abren, porque son los que se están escribiendo. Se toma una
   * vez: lo que cambie después no debe replegar nada que el entrenador abrió.
   */
  const [initialExerciseIds] = useState<ReadonlySet<string>>(
    () =>
      new Set(draft.blocks.flatMap((block) => block.exercises.map((exercise) => exercise.id)))
  )

  // Alfabético y con la intercalación del idioma, que es la que coloca la
  // eñe donde un hispanohablante la busca.
  const catalog = useMemo(
    () =>
      [...exercises].sort((left, right) =>
        left.name.localeCompare(right.name, activeLocale())
      ),
    [exercises]
  )

  const stepHasError: Record<FormStep, boolean> = {
    identity: errors.title !== undefined,
    blocks: errors.blocks !== undefined,
  }

  /*
   * El nombre lo genera la biblioteca a partir del contenido, asi que la pagina
   * lo lee del resultado en vez de componerlo por su cuenta: dos sitios
   * generando el mismo nombre se separan al primer cambio de formato.
   */
  const handleSaveToLibrary = async (block: BlockDraft) => {
    // Se espera al guardado: el nombre sale del bloque ya guardado, y contra
    // Supabase eso es un viaje de red.
    const saved = await saveFromDraft(block)
    setLastSavedName(saved.name)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const submission = submit()
    if (!submission.valid) {
      // Al primer paso que falla: el que tiene el nombre, si falta.
      setStep(submission.errors.title !== undefined ? 'identity' : 'blocks')
      return
    }

    // Se espera y se dice: un rechazo de la base dejaba el formulario tal
    // cual, sin mensaje, y quien guardaba no sabia si habia guardado.
    try {
      if (routineId === undefined) {
        const created = await createRoutine(submission.data)
        clearRoutineDraft(null)
        navigate(`/trainings/${created.id}`)
        return
      }

      await updateRoutine(routineId, submission.data)
      clearRoutineDraft(routineId)
      navigate(`/trainings/${routineId}`)
    } catch (caught) {
      toast.error(describeError(caught, t, 'routine.saveError'))
    }
  }

  // Cancelar es olvidar: el borrador guardado no debe reaparecer despues.
  const handleCancel = () => {
    clearRoutineDraft(routineId ?? null)
    navigate(isEditing ? `/trainings/${routineId}` : '/trainings')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden bg-bone">
      <PageHeader className="pb-2 md:pb-3">
        <Link
          to={isEditing ? `/trainings/${routineId}` : '/trainings'}
          className="-ms-2 mb-1 inline-flex h-11 items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60 transition-colors hover:text-cobalt"
        >
          <ArrowLeft className="size-4" />
          {isEditing ? t('routine.backToRecord') : t('routine.plural')}
        </Link>

        <PageHeader.Content>
          <PageHeader.Eyebrow>{t('trainings.eyebrow')}</PageHeader.Eyebrow>
          <PageHeader.Title>
            {isEditing ? t('routine.editTitle') : t('routine.newTitle')}
          </PageHeader.Title>

          <PageHeader.Actions>
            <PageHeader.SecondaryAction icon={X} label={t('common.cancel')} onClick={handleCancel} />
            <PageHeader.PrimaryAction
              icon={Check}
              type="submit"
              label={isEditing ? t('exercise.saveChanges') : t('routine.save')}
              shortLabel={t('common.save')}
            />
          </PageHeader.Actions>
        </PageHeader.Content>
      </PageHeader>

      <Tabs
        value={step}
        onValueChange={(value) => {
          if (isFormStep(value)) setStep(value)
        }}
        className="min-h-0 flex-1 gap-0"
      >
        <div className="flex shrink-0 flex-col gap-3 px-5 pb-3">
          <TabsList aria-label={t('routine.steps')} className="w-full md:max-w-md">
            {FORM_STEPS.map((formStep, index) => (
              <TabsTrigger
                key={formStep}
                value={formStep}
                className="gap-1.5 px-2 text-[13px] font-semibold"
              >
                {`${index + 1} · ${t(FORM_STEP_LABEL_KEY[formStep])}`}
                {/* La marca de error: un punto, y su nombre para quien no lo ve. */}
                {stepHasError[formStep] && (
                  <span
                    role="img"
                    aria-label={t('routine.stepHasError')}
                    className="size-2 shrink-0 rounded-full bg-danger"
                  />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <RoutineDraftLine routine={preview} />

          {/*
            `role="alert"` para que un lector de pantalla lo anuncie al
            aparecer. Encima de los pasos y no dentro del de bloques: el error
            surge al pulsar Guardar, que está en la cabecera, y tiene que verse
            desde el paso en que se esté.
          */}
          {errors.blocks !== undefined && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-block border border-danger/40 bg-danger-surface px-4 py-3 text-sm text-danger"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {errors.blocks}
            </p>
          )}
        </div>

        <div className={PAGE_SCROLL}>
          <div className="px-5 pb-6 pt-1">
            {/* Se dice que lo que se ve es un borrador recuperado, con la
                salida: quien no lo quiera lo descarta y empieza de cero. */}
            {restored && (
              <p className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-block border border-cobalt-tint-3 bg-surface px-4 py-3 text-sm text-ink/70">
                <span>{t('routine.draftRestored')}</span>
                <Button type="button" variant="ghost" size="sm" onClick={discard}>
                  {t('routine.discardDraft')}
                </Button>
              </p>
            )}

            <TabsContent value="identity">
              <RoutineIdentityFields
                title={draft.title}
                description={draft.description}
                level={draft.level}
                titleError={errors.title}
                onTitleChange={setTitle}
                onDescriptionChange={setDescription}
                onLevelChange={setLevel}
              />
            </TabsContent>

            <TabsContent value="blocks">
              {/* Sin ejercicios en el catalogo, los desplegables de cada bloque
                  salen vacios y nada dice por que. Se dice, con la puerta. */}
              {catalog.length === 0 && (
                <p className="mb-4 rounded-block border border-cobalt-tint-3 bg-surface px-4 py-3 text-sm text-ink/60">
                  {t('routine.emptyCatalogHint')}{' '}
                  <Link
                    to="/trainings/catalog"
                    className="inline-flex min-h-11 items-center font-semibold text-cobalt underline-offset-4 hover:underline"
                  >
                    {t('routine.goToCatalog')}
                  </Link>
                </p>
              )}

              <ul className="space-y-4">
                {draft.blocks.map((block, index) => (
                  <li key={block.id}>
                    <BlockEditor
                      block={block}
                      position={index + 1}
                      catalog={catalog}
                      canRemove={canRemoveBlock}
                      canSaveToLibrary={canSaveBlockDraft(block)}
                      initialExerciseIds={initialExerciseIds}
                      onChange={(changes) => updateBlock(block.id, changes)}
                      onRemove={() => removeBlock(block.id)}
                      onSaveToLibrary={() => handleSaveToLibrary(block)}
                      onAddExercise={() => addExercise(block.id)}
                      onRemoveExercise={(exerciseId) => removeExercise(block.id, exerciseId)}
                      onChangeExercise={(exerciseId, changes) =>
                        updateExercise(block.id, exerciseId, changes)
                      }
                    />
                  </li>
                ))}
              </ul>

              {/* `aria-live` y no `role="alert"`: es una confirmacion de algo
                  que el usuario acaba de pedir, no un aviso que interrumpa. */}
              <p aria-live="polite" className={cn('text-sm text-cobalt', lastSavedName !== null && 'mt-3')}>
                {lastSavedName !== null && t('routine.savedToLibrary', { name: lastSavedName })}
              </p>

              {/* Juntos y en fila: son las dos formas de añadir un bloque. */}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-w-[9.5rem] flex-1 gap-2 rounded-action"
                  onClick={addBlock}
                >
                  <Plus className="size-4" />
                  {t('routine.addBlock')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-w-[9.5rem] flex-1 gap-2 rounded-action"
                  onClick={() => setIsPickerOpen(true)}
                >
                  <Library className="size-4" />
                  {t('routine.insertSaved')}
                </Button>
              </div>
            </TabsContent>
          </div>
        </div>
      </Tabs>

      <SavedBlockPicker
        open={isPickerOpen}
        savedBlocks={savedBlocks}
        onOpenChange={setIsPickerOpen}
        onInsert={(savedBlock) => {
          insertBlock(savedBlock.block)
          setIsPickerOpen(false)
        }}
      />
    </form>
  )
}
