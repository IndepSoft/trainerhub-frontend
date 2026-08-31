import { useId } from 'react'
import { Copy, Dumbbell, type LucideIcon } from 'lucide-react'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { cn } from '@/shared/lib/utils'
import type { TrainingLevel } from '../types/training.types'

/** Registro de etiqueta del formulario, igual que el de las métricas. */
const FIELD_LABEL = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50'

/** De menos a más exigente, que es como se lee una escala. */
const TRAINING_LEVELS: TrainingLevel[] = ['Principiante', 'Intermedio', 'Avanzado']

interface RoutineIdentityFieldsProps {
  title: string
  description: string
  level: TrainingLevel
  isTemplate: boolean
  /** Mensaje bajo el título cuando la validación lo señala. */
  titleError?: string
  onTitleChange: (title: string) => void
  onDescriptionChange: (description: string) => void
  onLevelChange: (level: TrainingLevel) => void
  onIsTemplateChange: (isTemplate: boolean) => void
}

/**
 * Lo que identifica a la rutina: nombre, descripción, nivel y si es plantilla.
 * Sólo presentación.
 *
 * «Plantilla» se elige aquí, con el mismo par de iconos y rótulos que después
 * distingue a las tarjetas en la lista. Que la decisión y su consecuencia usen
 * el mismo lenguaje visual es lo que evita la confusión que hubo cuando las dos
 * cosas se pintaban idénticas.
 */
export function RoutineIdentityFields({
  title,
  description,
  level,
  isTemplate,
  titleError,
  onTitleChange,
  onDescriptionChange,
  onLevelChange,
  onIsTemplateChange,
}: RoutineIdentityFieldsProps) {
  const fieldId = useId()

  const titleFieldId = `${fieldId}-title`
  const titleErrorId = `${fieldId}-title-error`
  const descriptionFieldId = `${fieldId}-description`
  const levelFieldId = `${fieldId}-level`

  return (
    <section className="rounded-block border border-cobalt-tint-3 bg-white p-4 sm:p-5">
      <h2 className="border-b border-cobalt-tint-3 pb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
        La rutina
      </h2>

      <div className="mt-4">
        <Label htmlFor={titleFieldId} className={FIELD_LABEL}>
          Nombre
        </Label>
        <Input
          id={titleFieldId}
          className="mt-1.5"
          placeholder="Full body · Principiante"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          // `aria-describedby` sólo cuando hay mensaje: apuntar a un elemento
          // que no existe deja al lector de pantalla anunciando la nada.
          aria-invalid={titleError !== undefined}
          aria-describedby={titleError === undefined ? undefined : titleErrorId}
        />
        {titleError !== undefined && (
          <p id={titleErrorId} className="mt-1.5 text-sm text-danger">
            {titleError}
          </p>
        )}
      </div>

      <div className="mt-4">
        <Label htmlFor={descriptionFieldId} className={FIELD_LABEL}>
          Descripción
        </Label>
        <Textarea
          id={descriptionFieldId}
          className="mt-1.5"
          rows={2}
          placeholder="Para qué sirve y a quién va dirigida."
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={levelFieldId} className={FIELD_LABEL}>
            Nivel
          </Label>
          <Select
            value={level}
            onValueChange={(value) => onLevelChange(value as TrainingLevel)}
          >
            <SelectTrigger id={levelFieldId} className="mt-1.5 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRAINING_LEVELS.map((candidate) => (
                <SelectItem key={candidate} value={candidate}>
                  {candidate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/*
          Dos botones con `aria-pressed` y no un `radiogroup`: un grupo de radio
          accesible exige gestionar las flechas del teclado a mano, y con dos
          opciones excluyentes un par de conmutadores da el mismo resultado
          usando lo que el navegador ya sabe hacer.
        */}
        <div role="group" aria-label="Tipo de rutina">
          <span className={cn('block', FIELD_LABEL)}>Tipo</span>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <TypeOption
              icon={Dumbbell}
              label="Rutina"
              isSelected={!isTemplate}
              onSelect={() => onIsTemplateChange(false)}
            />
            <TypeOption
              icon={Copy}
              label="Plantilla"
              isSelected={isTemplate}
              onSelect={() => onIsTemplateChange(true)}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

interface TypeOptionProps {
  icon: LucideIcon
  label: string
  isSelected: boolean
  onSelect: () => void
}

/** Una de las dos mitades del conmutador de tipo. */
function TypeOption({ icon: Icon, label, isSelected, onSelect }: TypeOptionProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onSelect}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-action border px-3 text-xs font-bold uppercase tracking-[0.12em] transition-colors',
        isSelected
          ? 'border-ember/50 bg-ember/10 text-ember-deep'
          : 'border-cobalt-tint-3 text-ink/45 hover:border-cobalt/40 hover:text-ink'
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  )
}
