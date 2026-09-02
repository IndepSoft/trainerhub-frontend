import { useState, type FormEvent } from 'react'
import { Check, LogOut } from 'lucide-react'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { PageHeader } from '@/shared/components/PageHeader'
import { getInitials } from '@/shared/lib/personName'
import { cn } from '@/shared/lib/utils'
import { useLogout } from '@/auth/hooks/useLogout'
import { ThemeSelector } from '../components/ThemeSelector'
import { useProfileEditor, type ProfileDraft } from '../hooks/useProfileEditor'

const FIELD_LABEL = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60'

/**
 * Configuración. Sólo composición.
 *
 * ERA UN ENLACE MUERTO: la barra lateral llevaba a `/settings`, que no existía
 * como ruta, y el «Perfil» del menú de usuario no llevaba a ninguna parte. Dos
 * puertas pintadas en la pared.
 *
 * LO QUE HAY AQUÍ ES LO QUE EXISTE DE VERDAD. Un ajuste entra cuando hay algo
 * detrás que ajustar, no porque suela aparecer en una pantalla de ajustes:
 *
 *  - TEMA: sí, y no fue una casilla. El bloque `.dark` era el de shadcn por
 *    defecto —sin bone, ink, cobalt ni ember—, así que hubo que escribir la
 *    paleta oscura entera antes de que el conmutador significara algo.
 *  - CONTRASEÑA: no. `AuthPort` no expone cambiarla.
 *  - NOTIFICACIONES: no. No hay más canal que la campana, y ésa no se apaga.
 *
 * Los ajustes del EQUIPO no están aquí sino en `/crew/ajustes`: son de la casa,
 * no de la persona, y los cambia quien la gobierna. Mezclarlos haría que un
 * entrenador buscara su nombre entre las reglas del equipo.
 */
export default function Settings() {
  const { owner, profileId, initial, email, saving, error, save } = useProfileEditor()
  const { handleLogout } = useLogout()

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      <PageHeader className="pb-4">
        <PageHeader.Eyebrow>Tu cuenta</PageHeader.Eyebrow>
        <PageHeader.Title>Configuración</PageHeader.Title>
      </PageHeader>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-md space-y-8 px-5 py-6">
          <section aria-labelledby="perfil-titulo" className="space-y-4">
            <h2
              id="perfil-titulo"
              className="border-b border-cobalt-tint-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60"
            >
              Perfil
            </h2>

            {error !== null && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {owner === 'none' ? (
              <p className="text-sm text-ink/45">
                {/* Estado legítimo, no un fallo: el nombre y la cara viven en la
                    ficha que a uno le corresponda, y quien no está en ningún
                    equipo todavía no tiene ninguna. */}
                Tu perfil vive en tu ficha del equipo. Cuando te unas a uno,
                podrás cambiar tu nombre y tu foto desde aquí.
              </p>
            ) : (
              /*
                La clave es LA FICHA, no lo escrito en ella. Al cambiar de
                persona el borrador se reinicia, que es lo que hace falta; con
                los valores como clave, guardar remontaba el formulario —al
                guardar cambian— y se perdía el acuse.
              */
              <ProfileFields
                key={profileId ?? 'sin-ficha'}
                initial={initial}
                saving={saving}
                onSave={save}
              />
            )}
          </section>

          <section aria-labelledby="apariencia-titulo" className="space-y-4">
            <h2
              id="apariencia-titulo"
              className="border-b border-cobalt-tint-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60"
            >
              Apariencia
            </h2>

            <div>
              <span className={cn('block', FIELD_LABEL)}>Tema</span>
              <div className="mt-2">
                <ThemeSelector />
              </div>
            </div>
          </section>

          <section aria-labelledby="cuenta-titulo" className="space-y-4">
            <h2
              id="cuenta-titulo"
              className="border-b border-cobalt-tint-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60"
            >
              Cuenta
            </h2>

            <div>
              <span className={cn('block', FIELD_LABEL)}>Correo</span>
              <p className="mt-1 text-sm text-ink/70">{email === '' ? '—' : email}</p>
              <p className="mt-1 text-xs text-ink/45">
                {/* El porqué, donde se ve que no se puede cambiar. Un campo
                    apagado sin explicación se lee como un fallo. */}
                No se cambia desde aquí: es la llave con la que se te reconoce, y
                lo que enlazó tu cuenta con tu ficha.
              </p>
            </div>

            <Button variant="outline" className="w-full gap-2" onClick={handleLogout}>
              <LogOut className="size-4" />
              Cerrar sesión
            </Button>
          </section>
        </div>
      </div>
    </div>
  )
}

interface ProfileFieldsProps {
  initial: ProfileDraft
  saving: boolean
  onSave: (draft: ProfileDraft) => Promise<boolean>
}

function ProfileFields({ initial, saving, onSave }: ProfileFieldsProps) {
  const [draft, setDraft] = useState(initial)
  const [justSaved, setJustSaved] = useState(false)
  const [missingName, setMissingName] = useState(false)

  const setField = (field: keyof ProfileDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setMissingName(false)
    setJustSaved(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (draft.firstName.trim() === '' || draft.lastName.trim() === '') {
      setMissingName(true)
      return
    }

    const saved = await onSave(draft)
    if (!saved) return

    // Acuse en el sitio: guardar no navega a ninguna parte, y sin él el botón
    // parece no haber hecho nada.
    setJustSaved(true)
    window.setTimeout(() => setJustSaved(false), 2500)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4">
        {/* La foto se ve mientras se escribe la dirección: pegar un enlace y no
            saber si vale hasta guardar es el fallo clásico de estos campos. */}
        <Avatar className="size-16 shrink-0">
          <AvatarImage src={draft.photoUrl === '' ? undefined : draft.photoUrl} alt="" />
          <AvatarFallback className="bg-cobalt-tint-2 text-cobalt">
            {getInitials(draft.firstName, draft.lastName)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <Label htmlFor="perfil-foto" className={FIELD_LABEL}>
            Foto
          </Label>
          <Input
            id="perfil-foto"
            value={draft.photoUrl}
            onChange={(event) => setField('photoUrl', event.target.value)}
            placeholder="https://…"
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor="perfil-nombre" className={FIELD_LABEL}>
              Nombre
            </Label>
            {missingName && (
              <span className="text-[11px] font-semibold text-danger">Falta este campo</span>
            )}
          </div>
          <Input
            id="perfil-nombre"
            value={draft.firstName}
            onChange={(event) => setField('firstName', event.target.value)}
            className={cn('mt-1.5', missingName && draft.firstName.trim() === '' && 'border-danger')}
          />
        </div>

        <div>
          <Label htmlFor="perfil-apellidos" className={FIELD_LABEL}>
            Apellidos
          </Label>
          <Input
            id="perfil-apellidos"
            value={draft.lastName}
            onChange={(event) => setField('lastName', event.target.value)}
            className={cn('mt-1.5', missingName && draft.lastName.trim() === '' && 'border-danger')}
          />
        </div>
      </div>

      <Button type="submit" className="w-full gap-2" disabled={saving}>
        {justSaved ? <Check className="size-4" /> : null}
        {saving ? 'Guardando…' : justSaved ? 'Perfil guardado' : 'Guardar'}
      </Button>
    </form>
  )
}
