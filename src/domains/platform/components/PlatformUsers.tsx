import { useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { cn } from '@/shared/lib/utils'
import { CAPABILITY_LABEL, ROLE_LABEL } from '@/shared/domain/permissions'
import { usePlatformUsers } from '../hooks/usePlatformUsers'
import { RolePermissionsDialog } from '@/shared/components/RolePermissionsDialog'
import type { CrewRole } from '@/shared/domain/entities/crew'
import type { PlatformUser } from '@/shared/domain/ports/PlatformRepository'

/** El filtro de rol, con «todos» delante. `null` es sin filtrar. */
const ROLE_FILTERS: Array<CrewRole | null> = [null, 'admin', 'trainer', 'student']

const ROLE_BADGE: Record<CrewRole, string> = {
  admin: 'border-cobalt/40 bg-cobalt-tint text-cobalt',
  trainer: 'border-cobalt-tint-3 text-ink/55',
  student: 'border-cobalt-tint-3 text-ink/40',
}

/**
 * Las cuentas de la plataforma. Sólo composición.
 *
 * IDENTIDAD Y ACCESO, NUNCA CONTENIDO. Aquí se ve quién es cada uno, en qué
 * equipo está y con qué rol; nada de lo que entrena. Administrar la plataforma
 * no es leer los datos de los alumnos de un cliente, y esa línea es lo que hace
 * que el resto de los equipos siga siendo privado.
 */
export function PlatformUsers() {
  const {
    users,
    total,
    page,
    pageCount,
    search,
    role,
    loading,
    error,
    setPage,
    setSearch,
    setRole,
    setMembership,
  } = usePlatformUsers()

  const [editing, setEditing] = useState<PlatformUser | null>(null)

  return (
    <section className="space-y-4">
      <div className="space-y-3">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink/30"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre o correo"
            aria-label="Buscar cuentas"
            className="ps-9"
          />
        </div>

        <div role="group" aria-label="Filtrar por rol" className="flex flex-wrap gap-1">
          {ROLE_FILTERS.map((candidate) => (
            <button
              key={candidate ?? 'todos'}
              type="button"
              aria-pressed={candidate === role}
              onClick={() => setRole(candidate)}
              className={cn(
                'inline-flex min-h-11 items-center rounded-action px-3 text-xs font-semibold uppercase tracking-wider transition-colors',
                candidate === role
                  ? 'bg-cobalt text-white'
                  : 'text-ink/45 hover:bg-cobalt-tint hover:text-cobalt'
              )}
            >
              {candidate === null ? 'Todos' : ROLE_LABEL[candidate]}
            </button>
          ))}
        </div>
      </div>

      {error !== null && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && users.length === 0 ? (
        <p className="py-8 text-sm text-ink/45">
          {/* Se distingue «no hay nadie» de «tu búsqueda no encuentra nada»: con
              un filtro puesto, lo segundo no es un problema de la plataforma. */}
          {search.trim() === '' && role === null
            ? 'Todavía no hay ninguna cuenta.'
            : 'Ninguna cuenta coincide con lo que buscas.'}
        </p>
      ) : (
        <ul className="divide-y divide-cobalt-tint-3 border-y border-cobalt-tint-3">
          {users.map((user) => (
            <li
              key={user.membershipId}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{user.displayName}</p>
                <p className="truncate text-xs text-ink/45">
                  {user.email} · {user.crewName}
                </p>
                {user.extraCapabilities.length > 0 && (
                  /* Las concesiones se ven en la fila: son la excepción, y una
                     excepción que hay que abrir un diálogo para descubrir es una
                     excepción que se olvida. */
                  <p className="truncate text-xs text-cobalt">
                    +{' '}
                    {user.extraCapabilities
                      .map((capability) => CAPABILITY_LABEL[capability])
                      .join(', ')}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'shrink-0 rounded-action border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]',
                    ROLE_BADGE[user.role]
                  )}
                >
                  {ROLE_LABEL[user.role]}
                </span>

                <Button
                  variant="outline"
                  className="ms-auto shrink-0 sm:ms-0"
                  onClick={() => setEditing(user)}
                >
                  Permisos
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* El paginador se esconde con una sola página: un «1 de 1» con dos
          flechas apagadas es ruido que sugiere que falta algo. */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-ink/45">
            Página {page} de {pageCount} · {total} cuentas
          </p>

          <div className="flex gap-1">
            <button
              type="button"
              aria-label="Página anterior"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="inline-flex size-11 items-center justify-center rounded-action text-ink/50 transition-colors hover:bg-cobalt-tint hover:text-cobalt disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Página siguiente"
              disabled={page === pageCount}
              onClick={() => setPage(page + 1)}
              className="inline-flex size-11 items-center justify-center rounded-action text-ink/50 transition-colors hover:bg-cobalt-tint hover:text-cobalt disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      )}

      <RolePermissionsDialog
        open={editing !== null}
        subject={
          editing === null
            ? null
            : {
                id: editing.membershipId,
                displayName: editing.displayName,
                subtitle: `${editing.email} · ${editing.crewName}`,
                role: editing.role,
                extraCapabilities: editing.extraCapabilities,
              }
        }
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
        onSave={async (newRole, extraCapabilities) => {
          if (editing === null) return
          await setMembership({
            membershipId: editing.membershipId,
            role: newRole,
            extraCapabilities,
          })
        }}
      />
    </section>
  )
}
