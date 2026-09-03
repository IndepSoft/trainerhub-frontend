import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Library, Plus } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/components/PageHeader'
import { useTrainingCatalog } from '../hooks/useTrainingCatalog'
import { useRoutine } from '../hooks/useRoutines'
import { useRoutineDraft } from '../hooks/useRoutineDraft'
import { useBlockLibrary } from '../hooks/useBlockLibrary'
import { useRoutineActions } from '../hooks/useRoutineActions'
import { canSaveBlockDraft } from '../libs/blockLibrary'
import { BlockEditor } from '../components/BlockEditor'
import { SavedBlockPicker } from '../components/SavedBlockPicker'
import { RoutineDraftSummary } from '../components/RoutineDraftSummary'
import { RoutineIdentityFields } from '../components/RoutineIdentityFields'
import type { BlockDraft } from '../types/routineDraft.types'
import type { Routine } from '@/shared/domain/entities/routine'
import { activeLocale } from '@/shared/i18n/activeLocale'
import { useTranslation } from '@/shared/i18n/LanguageContext'

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
 *
 * El resumen va arriba y no al final: la duración estimada es la cifra que
 * decide si una sesión cabe en el hueco de la agenda, y verla cambiar mientras
 * se añaden bloques es justo lo que evita descubrir al guardar que la sesión
 * dura hora y media.
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
        <p className="text-sm text-ink/50">
          {t('routine.notFoundHint')}
        </p>
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

interface RoutineFormFieldsProps {
  /** La rutina que se edita, o `null` para dar una de alta. */
  routine: Routine | null
}

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
  } = useRoutineDraft(routine)
  const { savedBlocks, saveFromDraft } = useBlockLibrary()

  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [lastSavedName, setLastSavedName] = useState<string | null>(null)

  // Alfabético y con la intercalación del castellano, que es la que coloca la
  // eñe donde un hispanohablante la busca.
  const catalog = useMemo(
    () => [...exercises].sort((left, right) => left.name.localeCompare(right.name, activeLocale())),
    [exercises]
  )

  /*
   * El nombre lo genera la biblioteca a partir del contenido, asi que la pagina
   * lo lee del resultado en vez de componerlo por su cuenta: dos sitios
   * generando el mismo nombre se separan al primer cambio de formato.
   */
  const handleSaveToLibrary = (block: BlockDraft) => {
    setLastSavedName(saveFromDraft(block).name)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const data = submit()
    if (data === null) return

    if (routineId === undefined) {
      const created = await createRoutine(data)
      navigate(`/trainings/${created.id}`)
      return
    }

    await updateRoutine(routineId, data)
    navigate(`/trainings/${routineId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden bg-bone">
      <PageHeader>
        <Link
          to={isEditing ? `/trainings/${routineId}` : '/trainings'}
          className="-ms-2 mb-3 inline-flex h-11 items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/45 transition-colors hover:text-cobalt"
        >
          <ArrowLeft className="size-4" />
          {isEditing ? t('routine.backToRecord') : t('routine.plural')}
        </Link>

        <PageHeader.Content>
          <div className="min-w-0">
            <PageHeader.Eyebrow>{t('trainings.eyebrow')}</PageHeader.Eyebrow>
            <PageHeader.Title>
              {isEditing ? t('routine.editTitle') : t('routine.newTitle')}
            </PageHeader.Title>
          </div>

          <PageHeader.Actions>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(isEditing ? `/trainings/${routineId}` : '/trainings')}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              {isEditing ? t('exercise.saveChanges') : t('routine.save')}
            </Button>
          </PageHeader.Actions>
        </PageHeader.Content>
      </PageHeader>

      <div className="flex-1 overflow-auto">
        <RoutineDraftSummary routine={preview} />

        <div className="space-y-6 px-5 py-6">
          {/*
            `role="alert"` para que un lector de pantalla lo anuncie al
            aparecer: el error surge tras pulsar Guardar, y quien no ve la
            pantalla no tiene forma de saber que arriba ha salido un aviso.
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

          <RoutineIdentityFields
            title={draft.title}
            description={draft.description}
            level={draft.level}
            titleError={errors.title}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onLevelChange={setLevel}
          />

          <div>
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
              {t('routine.blocks')}
            </h2>

            <ul className="space-y-4">
              {draft.blocks.map((block, index) => (
                <li key={block.id}>
                  <BlockEditor
                    block={block}
                    position={index + 1}
                    catalog={catalog}
                    canRemove={canRemoveBlock}
                    canSaveToLibrary={canSaveBlockDraft(block)}
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

            {/* `aria-live` y no `role="alert"`: es una confirmacion de algo que
                el usuario acaba de pedir, no un aviso que interrumpa. */}
            <p aria-live="polite" className="mt-3 min-h-5 text-sm text-cobalt">
              {lastSavedName !== null && `«${lastSavedName}» guardado en la biblioteca.`}
            </p>

            <div className="mt-1 flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" className="flex-1 gap-2" onClick={addBlock}>
                <Plus className="size-4" />
                {t('routine.addBlock')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => setIsPickerOpen(true)}
              >
                <Library className="size-4" />
                {t('routine.insertSaved')}
              </Button>
            </div>
          </div>
        </div>
      </div>

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
