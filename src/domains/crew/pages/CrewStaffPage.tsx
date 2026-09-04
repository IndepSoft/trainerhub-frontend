import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { PageHeader } from '@/shared/components/PageHeader'
import { ConfirmDeleteDialog } from '@/shared/components/ConfirmDeleteDialog'
import { RolePermissionsDialog } from '@/shared/components/RolePermissionsDialog'
import { cn } from '@/shared/lib/utils'
import { CAPABILITY_LABEL_KEY, ROLE_LABEL_KEY } from '@/shared/i18n/domainLabels'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { useViewerContext } from '@/app/ViewerContext'
import { useCrewStaff } from '../hooks/useCrewStaff'
import { NotAllowedHere } from '../components/NotAllowedHere'
import type { CrewRole, CrewStaff } from '@/shared/domain/entities/crew'

const ROLE_BADGE: Record<CrewRole, string> = {
  admin: 'border-cobalt/40 bg-cobalt-tint text-cobalt',
  trainer: 'border-cobalt-tint-3 text-ink/55',
  student: 'border-cobalt-tint-3 text-ink/40',
}

/**
 * Quién trabaja en este equipo. Sólo composición.
 *
 * ES LA PANTALLA QUE LE FALTABA A `crew.staff`. La capacidad existía desde que
 * se separaron gobernar y entrenar, y no la comprobaba nadie porque no había
 * dónde: sólo se podía cambiar un puesto desde el panel de plataforma, que es de
 * otra persona y para otra cosa.
 *
 * Aquí lo hace quien gobierna SU equipo, que es quien de verdad sabe a quién
 * asciende.
 */
export default function CrewStaffPage() {
  const { active, can, loading: loadingViewer } = useViewerContext()
  const { t } = useTranslation()
  const { staff, loading, error, blockerFor, updateMembership, removeStaff } = useCrewStaff()

  const [editing, setEditing] = useState<CrewStaff | null>(null)
  const [removing, setRemoving] = useState<CrewStaff | null>(null)

  if (loadingViewer) return null
  if (active === null || !can('crew.staff')) {
    return (
      <NotAllowedHere description={t('crew.staffNotAllowed')} />
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      <PageHeader className="pb-4">
        <PageHeader.Eyebrow>{active.crew.name}</PageHeader.Eyebrow>
        <PageHeader.Title>{t('crew.staff')}</PageHeader.Title>
      </PageHeader>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-2xl space-y-4 px-5 py-6">
          <p className="text-sm text-ink/60">
            {/* La diferencia, dicha donde se decide: es lo único que separa a un
                rol del otro, y sin explicarlo la elección es a ciegas. */}
            Un administrador cambia los ajustes y decide quién trabaja aquí. Un
            entrenador hace todo lo demás.
          </p>

          {error !== null && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && staff.length === 0 ? (
            <p className="py-8 text-sm text-ink/45">
              {t('crew.staffEmpty')}
            </p>
          ) : (
            <ul className="divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3">
              {staff.map((post) => {
                const removalBlocker = blockerFor(post.id, null)

                return (
                  <li
                    key={post.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">{post.displayName}</p>
                      <p className="truncate text-xs text-ink/45">{post.email}</p>
                      {post.extraCapabilities.length > 0 && (
                        <p className="truncate text-xs text-cobalt">
                          +{' '}
                          {post.extraCapabilities
                            .map((capability) => t(CAPABILITY_LABEL_KEY[capability]))
                            .join(', ')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'shrink-0 rounded-action border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]',
                          ROLE_BADGE[post.role]
                        )}
                      >
                        {t(ROLE_LABEL_KEY[post.role])}
                      </span>

                      <Button
                        variant="outline"
                        className="ms-auto shrink-0 sm:ms-0"
                        onClick={() => setEditing(post)}
                      >
                        {t('roleDialog.permissions')}
                      </Button>

                      {/*
                        Al último administrador no se le ofrece la baja: el botón
                        se apaga y el título dice por qué. Dejarlo pulsable para
                        explicarlo después haría creer que fue un fallo.
                      */}
                      <button
                        type="button"
                        aria-label={`Quitar del equipo a ${post.displayName}`}
                        title={removalBlocker}
                        disabled={removalBlocker !== undefined}
                        onClick={() => setRemoving(post)}
                        className="inline-flex size-11 shrink-0 items-center justify-center rounded-action text-ink/30 transition-colors hover:text-danger disabled:pointer-events-none disabled:opacity-25"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <RolePermissionsDialog
        open={editing !== null}
        subject={
          editing === null
            ? null
            : {
                id: editing.id,
                displayName: editing.displayName,
                subtitle: editing.email,
                role: editing.role,
                extraCapabilities: editing.extraCapabilities,
              }
        }
        blockedReason={editing === null ? undefined : blockerFor(editing.id, 'trainer')}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
        onSave={async (role, extraCapabilities) => {
          if (editing === null) return
          await updateMembership(editing.id, role, extraCapabilities)
        }}
      />

      <ConfirmDeleteDialog
        open={removing !== null}
        name={removing?.displayName ?? ''}
        kind="del equipo técnico a"
        onOpenChange={(open) => {
          if (!open) setRemoving(null)
        }}
        onConfirm={() => {
          if (removing === null) return
          void removeStaff(removing.id).then(() => setRemoving(null))
        }}
      />
    </div>
  )
}
