import { useState, type FormEvent } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Textarea } from '@/shared/ui/textarea'
import { NOTICE_MAX_LENGTH, type NoticeKind } from '@/shared/domain/entities/notice'

interface NoticeDialogProps {
  open: boolean
  /** A quién se le manda, para nombrarlo y para redactar el borrador. */
  studentFirstName: string
  /** El texto con el que se abre. Vacío para un aviso libre. */
  draft: string
  kind: NoticeKind
  onOpenChange: (open: boolean) => void
  onSend: (body: string, kind: NoticeKind) => Promise<void>
}

/**
 * Mandarle un aviso a un alumno.
 *
 * VIENE CON EL TEXTO ESCRITO cuando es un recordatorio de cuota, y se puede
 * cambiar. Un campo en blanco obliga a redactar el mismo mensaje cada mes, y
 * quien tiene que escribirlo veinte veces acaba no mandándolo. El borrador es
 * una propuesta, no una plantilla cerrada: el tono de un recordatorio depende de
 * a quién se le manda.
 *
 * ES PRIVADO, y se dice. El muro está a dos pantallas de aquí y lo lee el equipo
 * entero; que alguien confunda los dos sitios con un recordatorio de dinero es
 * exactamente lo que no puede pasar.
 */
export function NoticeDialog({
  open,
  studentFirstName,
  draft,
  kind,
  onOpenChange,
  onSend,
}: NoticeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
            Avisar a {studentFirstName}
          </DialogTitle>
          <DialogDescription className="text-sm text-ink/50">
            Sólo lo ve {studentFirstName}, en su campana. No aparece en el muro.
          </DialogDescription>
        </DialogHeader>

        {/* Con `key` para que el borrador se reinicialice al cambiar de motivo:
            abrir «recordar cuota» tras haber escrito un aviso libre debe traer
            el texto de la cuota, no lo anterior. */}
        <NoticeFields
          key={`${kind}-${draft}`}
          draft={draft}
          kind={kind}
          onSend={onSend}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

interface NoticeFieldsProps {
  draft: string
  kind: NoticeKind
  onSend: (body: string, kind: NoticeKind) => Promise<void>
  onCancel: () => void
}

function NoticeFields({ draft, kind, onSend, onCancel }: NoticeFieldsProps) {
  const [body, setBody] = useState(draft)
  const [sending, setSending] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (body.trim() === '') return

    setSending(true)
    await onSend(body.trim(), kind)
    setSending(false)
    onCancel()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label htmlFor="aviso-texto" className="sr-only">
        Texto del aviso
      </label>
      <Textarea
        id="aviso-texto"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        maxLength={NOTICE_MAX_LENGTH}
        rows={4}
        className="resize-none"
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="gap-2" disabled={sending || body.trim() === ''}>
          <Send className="size-4" />
          {sending ? 'Enviando…' : 'Enviar aviso'}
        </Button>
      </div>
    </form>
  )
}
