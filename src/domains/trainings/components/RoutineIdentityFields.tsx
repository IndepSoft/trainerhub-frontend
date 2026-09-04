import { useId } from 'react'
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
import type { TrainingLevel } from '../types/training.types'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { STUDENT_LEVEL_LABEL_KEY } from '@/shared/i18n/domainLabels'

/** Registro de etiqueta del formulario, igual que el de las métricas. */
const FIELD_LABEL = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50'

/** De menos a más exigente, que es como se lee una escala. */
const TRAINING_LEVELS: TrainingLevel[] = ['Principiante', 'Intermedio', 'Avanzado']

interface RoutineIdentityFieldsProps {
  title: string
  description: string
  level: TrainingLevel
  /** Mensaje bajo el título cuando la validación lo señala. */
  titleError?: string
  onTitleChange: (title: string) => void
  onDescriptionChange: (description: string) => void
  onLevelChange: (level: TrainingLevel) => void
}

/**
 * Lo que identifica a la rutina: nombre, descripción y nivel. Sólo presentación.
 */
export function RoutineIdentityFields({
  title,
  description,
  level,
  titleError,
  onTitleChange,
  onDescriptionChange,
  onLevelChange,
}: RoutineIdentityFieldsProps) {
  const { t } = useTranslation()
  const fieldId = useId()

  const titleFieldId = `${fieldId}-title`
  const titleErrorId = `${fieldId}-title-error`
  const descriptionFieldId = `${fieldId}-description`
  const levelFieldId = `${fieldId}-level`

  return (
    <section className="rounded-block border border-cobalt-tint-3 bg-surface p-4 sm:p-5">
      <h2 className="border-b border-cobalt-tint-3 pb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
        {t('routine.identity')}
      </h2>

      <div className="mt-4">
        <Label htmlFor={titleFieldId} className={FIELD_LABEL}>
          {t('exercise.name')}
        </Label>
        <Input
          id={titleFieldId}
          className="mt-1.5"
          placeholder={t('routine.namePlaceholder')}
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
          {t('exercise.description')}
        </Label>
        <Textarea
          id={descriptionFieldId}
          className="mt-1.5"
          rows={2}
          placeholder={t('routine.descriptionPlaceholder')}
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
        />
      </div>

      {/*
        Sin conmutador «Rutina / Plantilla». La marca `isTemplate` desaparecio
        del modelo: no gobernaba ningun comportamiento y, sin nada asignado a
        ningun estudiante, todas las rutinas eran igualmente plantillas. Pedirle
        al entrenador que decidiera algo que no cambiaba nada era hacerle perder
        el tiempo en el paso mas frecuente.
      */}
      <div className="mt-4 sm:max-w-xs">
        <Label htmlFor={levelFieldId} className={FIELD_LABEL}>
          {t('routine.level')}
        </Label>
        <Select value={level} onValueChange={(value) => onLevelChange(value as TrainingLevel)}>
          <SelectTrigger id={levelFieldId} className="mt-1.5 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRAINING_LEVELS.map((candidate) => (
              <SelectItem key={candidate} value={candidate}>
                {t(STUDENT_LEVEL_LABEL_KEY[candidate])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  )
}
