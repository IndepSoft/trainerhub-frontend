import { AlertTriangle } from 'lucide-react'
import { Button } from '@/shared/ui/button'

interface ScheduleConflictNoticeProps {
  /** Con qué choca, ya redactado por `describeOverlap`. */
  message: string
  onOverride: () => void
}

/**
 * Aviso de solape con la opción de agendar igualmente.
 *
 * AVISA, NO BLOQUEA. Hay solapes legítimos —una sesión online en paralelo, un
 * margen de quince minutos que el entrenador acepta— y prohibirlos en seco es la
 * clase de rigidez que hace que la gente pelee con la herramienta o se la salte
 * por fuera. Lo que sí es inaceptable es doblar la agenda **sin enterarse**: por
 * eso el aviso nombra con qué choca y obliga a un segundo gesto deliberado.
 *
 * Vive en `shared` porque los dos formularios que agendan —el de la agenda y el
 * de la ficha del estudiante— tienen que decir exactamente lo mismo, y pronto
 * será el tercero cuando la asignación masiva de planes genere sesiones.
 */
export function ScheduleConflictNotice({ message, onOverride }: ScheduleConflictNoticeProps) {
  return (
    <div
      role="alert"
      className="space-y-3 rounded-block border border-warning/50 bg-warning-surface px-4 py-3"
    >
      <p className="flex items-start gap-2 text-sm text-ink/70">
        <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
        <span>{message}</span>
      </p>
      {/* La anulación es el botón secundario: lo esperado es corregir la hora,
          no insistir. */}
      <Button type="button" variant="outline" className="w-full" onClick={onOverride}>
        Agendar de todos modos
      </Button>
    </div>
  )
}
