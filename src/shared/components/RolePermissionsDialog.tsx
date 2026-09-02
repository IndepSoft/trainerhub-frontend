import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { cn } from '@/shared/lib/utils'
import {
  ALL_CAPABILITIES,
  CAPABILITIES_BY_ROLE,
  CAPABILITY_LABEL,
  ROLE_DESCRIPTION,
  ROLE_LABEL,
  type Capability,
} from '@/shared/domain/permissions'
import type { CrewRole } from '@/shared/domain/entities/crew'

/**
 * A quién se le está cambiando el papel.
 *
 * Forma propia y no `PlatformUser`: lo usan dos dominios —el panel de plataforma
 * y el equipo técnico de un crew— y cada uno tiene su tipo. Pedir el de uno
 * obligaría al otro a fabricarlo con campos que no le incumben.
 */
export interface RoleSubject {
  /** Identifica la PERTENENCIA, no a la persona: una por equipo. */
  id: string
  displayName: string
  /** La segunda línea: correo, equipo, lo que distinga a esta pertenencia. */
  subtitle: string
  role: CrewRole
  extraCapabilities: Capability[]
}

/** Los roles que se pueden asignar, de más a menos poder. */
const ASSIGNABLE_ROLES: CrewRole[] = ['admin', 'trainer', 'student']

interface RolePermissionsDialogProps {
  open: boolean
  subject: RoleSubject | null
  onOpenChange: (open: boolean) => void
  onSave: (role: CrewRole, extraCapabilities: Capability[]) => Promise<void>
  /**
   * Por qué no se puede guardar, si es que no se puede.
   *
   * Lo decide quien lo monta, porque la razón depende del contexto: en un equipo
   * es «no puedes quitar al último administrador», y ese conocimiento no es del
   * diálogo.
   */
  blockedReason?: string
}

/**
 * Rol y permisos de una persona en su equipo.
 *
 * SE MONTA CON `key` desde quien lo usa, para que el borrador se reinicialice al
 * cambiar de persona. Es el mismo patrón que el formulario de alumno.
 */
export function RolePermissionsDialog({
  open,
  subject,
  onOpenChange,
  onSave,
  blockedReason,
}: RolePermissionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        {subject !== null && (
          <>
            <DialogHeader className="text-left">
              <DialogTitle className="font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
                {subject.displayName}
              </DialogTitle>
              <DialogDescription className="text-sm text-ink/50">
                {subject.subtitle}
              </DialogDescription>
            </DialogHeader>

            <MembershipFields
              key={subject.id}
              subject={subject}
              blockedReason={blockedReason}
              onSave={onSave}
              onCancel={() => onOpenChange(false)}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface MembershipFieldsProps {
  subject: RoleSubject
  blockedReason?: string
  onSave: (role: CrewRole, extraCapabilities: Capability[]) => Promise<void>
  onCancel: () => void
}

function MembershipFields({
  subject,
  blockedReason,
  onSave,
  onCancel,
}: MembershipFieldsProps) {
  const [role, setRole] = useState<CrewRole>(subject.role)
  const [extras, setExtras] = useState<Capability[]>(subject.extraCapabilities)
  const [saving, setSaving] = useState(false)

  const included = CAPABILITIES_BY_ROLE[role]

  const toggleExtra = (capability: Capability) => {
    setExtras((current) =>
      current.includes(capability)
        ? current.filter((entry) => entry !== capability)
        : [...current, capability]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    await onSave(role, extras)
    setSaving(false)
    onCancel()
  }

  return (
    <div className="space-y-5">
      <div role="group" aria-label="Rol">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
          Rol
        </span>

        <div className="mt-2 space-y-2">
          {ASSIGNABLE_ROLES.map((candidate) => (
            <button
              key={candidate}
              type="button"
              aria-pressed={candidate === role}
              onClick={() => setRole(candidate)}
              className={cn(
                'flex w-full min-h-11 flex-col items-start gap-0.5 rounded-block border p-3 text-start transition-colors',
                candidate === role
                  ? 'border-cobalt/50 bg-cobalt-tint'
                  : 'border-cobalt-tint-3 hover:border-cobalt/40'
              )}
            >
              <span className="text-sm font-semibold text-ink">{ROLE_LABEL[candidate]}</span>
              <span className="text-xs text-ink/50">{ROLE_DESCRIPTION[candidate]}</span>
            </button>
          ))}
        </div>
      </div>

      <div role="group" aria-label="Permisos">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
          Permisos
        </span>
        <p className="mt-1 text-xs text-ink/45">
          {/* El invariante, dicho donde se decide: es lo que hace que la
              pregunta «¿qué puede hacer éste?» siga teniendo respuesta corta. */}
          Los del rol vienen marcados y no se pueden quitar. Lo que añadas aquí
          suma por encima.
        </p>

        <ul className="mt-2 space-y-1">
          {ALL_CAPABILITIES.map((capability) => {
            const fromRole = included.includes(capability)
            const granted = fromRole || extras.includes(capability)

            return (
              <li key={capability}>
                <button
                  type="button"
                  aria-pressed={granted}
                  disabled={fromRole}
                  onClick={() => toggleExtra(capability)}
                  className={cn(
                    'flex w-full min-h-11 items-center justify-between gap-3 rounded-block px-3 text-sm transition-colors',
                    granted ? 'text-ink' : 'text-ink/45',
                    fromRole
                      ? // Los del rol se ven concedidos pero apagados: quitarlos
                        // exigiría poder restar, que es justo lo que no se hace.
                        'cursor-default bg-cobalt-tint/50'
                      : 'hover:bg-cobalt-tint/40'
                  )}
                >
                  <span>{CAPABILITY_LABEL[capability]}</span>
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.12em]">
                    {fromRole ? 'Del rol' : granted ? 'Concedido' : 'No'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {blockedReason !== undefined && (
        <p className="rounded-block border border-danger/40 bg-danger/5 px-3 py-2 text-xs text-danger">
          {blockedReason}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="button"
          disabled={saving || blockedReason !== undefined}
          onClick={() => void handleSave()}
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </div>
  )
}
