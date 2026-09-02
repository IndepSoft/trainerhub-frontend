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
import type { PlatformUser } from '@/shared/domain/ports/PlatformRepository'

/** Los roles que se pueden asignar, de más a menos poder. */
const ASSIGNABLE_ROLES: CrewRole[] = ['admin', 'trainer', 'student']

interface MembershipDialogProps {
  open: boolean
  user: PlatformUser | null
  onOpenChange: (open: boolean) => void
  onSave: (role: CrewRole, extraCapabilities: Capability[]) => Promise<void>
}

/**
 * Rol y permisos de una persona en su equipo.
 *
 * SE MONTA CON `key` desde quien lo usa, para que el borrador se reinicialice al
 * cambiar de persona. Es el mismo patrón que el formulario de alumno.
 */
export function MembershipDialog({ open, user, onOpenChange, onSave }: MembershipDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        {user !== null && (
          <>
            <DialogHeader className="text-left">
              <DialogTitle className="font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-ink">
                {user.displayName}
              </DialogTitle>
              <DialogDescription className="text-sm text-ink/50">
                {user.email} · {user.crewName}
              </DialogDescription>
            </DialogHeader>

            <MembershipFields
              key={user.membershipId}
              user={user}
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
  user: PlatformUser
  onSave: (role: CrewRole, extraCapabilities: Capability[]) => Promise<void>
  onCancel: () => void
}

function MembershipFields({ user, onSave, onCancel }: MembershipFieldsProps) {
  const [role, setRole] = useState<CrewRole>(user.role)
  const [extras, setExtras] = useState<Capability[]>(user.extraCapabilities)
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

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" disabled={saving} onClick={() => void handleSave()}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </div>
  )
}
