import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { Check, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { ListRow } from '@/shared/components/ListRow'
import { describeError } from '@/shared/i18n/errorMessages'
import { useViewerContext } from '@/app/ViewerContext'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { PageHeader } from '@/shared/components/PageHeader'
import { getInitials } from '@/shared/lib/personName'
import { cn } from '@/shared/lib/utils'
import { useTranslation } from '@/shared/i18n/LanguageContext'
import { useLogout } from '@/auth/hooks/useLogout'
import { PasswordFields } from '@/auth/components/PasswordFields'
import { useProfileEditor, type ProfileDraft } from '../hooks/useProfileEditor'
import { usePhotoUpload } from '../hooks/usePhotoUpload'
import { useLeaveCrew } from '../hooks/useLeaveCrew'
import { ThemeSelector } from '../components/ThemeSelector'
import { LanguageSelector } from '../components/LanguageSelector'
import { SoundToggle } from '../components/SoundToggle'
import { DeleteAccountSection } from '../components/DeleteAccountSection'
import { ROLE_LABEL_KEY } from '@/shared/i18n/domainLabels'
import { PAGE_SCROLL } from '@/shared/lib/pageScroll'

const FIELD_LABEL = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60'

/**
 * Configuración. Sólo composición.
 *
 * ERA UN ENLACE MUERTO: la barra lateral llevaba a `/settings`, que no existía
 * como ruta, y el «Perfil» del menú de usuario no llevaba a ninguna parte. Dos
 * puertas pintadas en la pared.
 *
 * EN FILAS, y antes era una columna de formularios abiertos (`CAMBIOS` §49):
 * el perfil entero, la contraseña entera y seis botones apilados medían 1.700
 * px para una pantalla en la que casi nunca se cambia nada. Ahora cada ajuste
 * es una fila que dice CÓMO ESTÁ, y lo que hay que rellenar se abre en una
 * hoja. Lo que se mira, a la vista; lo que se hace de tanto en tanto, dentro.
 *
 * LO QUE HAY AQUÍ ES LO QUE EXISTE DE VERDAD. Un ajuste entra cuando hay algo
 * detrás que ajustar, no porque suela aparecer en una pantalla de ajustes:
 *
 *  - TEMA: sí, y no fue una casilla. El bloque `.dark` era el de shadcn por
 *    defecto —sin bone, ink, cobalt ni ember—, así que hubo que escribir la
 *    paleta oscura entera antes de que el conmutador significara algo.
 *  - IDIOMA: sí, y tampoco fue una casilla. Hubo que traducir la aplicación
 *    entera antes: un selector sobre media traducción deja la mitad de cada
 *    pantalla en el idioma que no se pidió.
 *  - SONIDO: sí, y es lo que permitió que el aviso de descanso existiera. No
 *    se ponía por no poder callarlo —un pitido que no se apaga en una sala
 *    compartida es peor que ninguno—, así que el interruptor no acompaña a la
 *    función: es su condición.
 *  - CONTRASEÑA: sí, desde que `AuthPort` expone `updatePassword`. Es el
 *    mismo formulario que la vuelta del correo de recuperación; aquí no pide
 *    la anterior porque ya se entró con ella.
 *  - NOTIFICACIONES: no. No hay más canal que la campana, y ésa no se apaga.
 *
 * Los ajustes del EQUIPO no están aquí sino en `/crew/ajustes`: son de la casa,
 * no de la persona, y los cambia quien la gobierna. Mezclarlos haría que un
 * entrenador buscara su nombre entre las reglas del equipo.
 */
export default function Settings() {
  const { t } = useTranslation()
  const { owner, profileId, initial, email, saving, error, save } = useProfileEditor()
  const { handleLogout } = useLogout()
  const { active, trainer, can } = useViewerContext()
  const navigate = useNavigate()

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)

  /*
   * SALIR DEL EQUIPO, que no existia: un alumno activo solo podia irse
   * eliminando la cuenta entera. Ver `useLeaveCrew`.
   */
  const { leaveCrew } = useLeaveCrew()
  const [isLeaveOpen, setIsLeaveOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [leaveError, setLeaveError] = useState<string | null>(null)
  const ownStudentId = active?.role === 'student' ? active.student?.id : undefined

  const handleLeave = async () => {
    if (ownStudentId === undefined) return
    setLeaving(true)
    setLeaveError(null)
    try {
      await leaveCrew(ownStudentId)
    } catch (caught) {
      setLeaveError(describeError(caught, t, 'settings.leaveCrewError'))
      setLeaving(false)
      return
    }
    setLeaving(false)
    setIsLeaveOpen(false)
    // A la raiz: sin equipo, `HomeRedirect` decide a donde.
    navigate('/', { replace: true })
  }

  const fullName = `${initial.firstName} ${initial.lastName}`.trim()

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      <PageHeader className="md:pb-4">
        <PageHeader.Eyebrow>{t('settings.eyebrow')}</PageHeader.Eyebrow>
        <PageHeader.Title>{t('settings.title')}</PageHeader.Title>
      </PageHeader>

      <div className={PAGE_SCROLL}>
        <div className="mx-auto flex max-w-md flex-col gap-6 px-5 pb-6">
          {error !== null && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* QUIÉN ERES, arriba y sin encabezado: es la respuesta a «¿de quién
              es esta aplicación?» y no necesita que se la anuncie. */}
          <section
            aria-label={t('settings.profile')}
            className="flex items-center gap-4 border-b border-cobalt-tint-3 pb-4"
          >
            <Avatar className="size-12 shrink-0">
              <AvatarImage src={initial.photoUrl === '' ? undefined : initial.photoUrl} alt="" />
              <AvatarFallback className="bg-cobalt-tint-2 text-cobalt">
                {getInitials(initial.firstName, initial.lastName)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              {/* Estado legítimo, no un fallo: el nombre y la cara viven en la
                  ficha que a uno le corresponda, y quien no está en ningún
                  equipo todavía no tiene ninguna. */}
              <p className="truncate font-semibold text-ink">
                {owner === 'none' || fullName === '' ? t('settings.profile.noRecord') : fullName}
              </p>
              <p className="truncate text-[13px] text-ink/60">{email === '' ? '—' : email}</p>
            </div>

            {owner !== 'none' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setIsProfileOpen(true)}
              >
                {t('common.edit')}
              </Button>
            )}
          </section>

          <SettingsSection heading={t('settings.appearance')}>
            <ThemeSelector />
            <LanguageSelector />
          </SettingsSection>

          {/* Entrenamiento y no «notificaciones»: esto no notifica nada
              desde fuera, suena mientras se entrena y con la pantalla delante.
              Llamarlo aviso haría buscarlo donde no está. */}
          <SettingsSection heading={t('settings.training')}>
            <SoundToggle />
          </SettingsSection>

          {/*
            La puerta al equipo desde la configuracion. Los ajustes del equipo
            viven en `/crew/ajustes` -son de la casa, no de la persona-, pero
            quien buscaba aqui «mi equipo» no encontraba ni el enlace, y quien
            no tiene equipo no encontraba como tenerlo.
          */}
          <SettingsSection heading={t('settings.crew')}>
            {active === null ? (
              <>
                {trainer !== null && <ListRow primary={t('crew.create')} to="/crew/nuevo" />}
                <ListRow
                  primary={t('joinCrew.haveCode')}
                  secondary={t('settings.crewNone')}
                  to="/crew/unirse"
                />
              </>
            ) : (
              <>
                <ListRow
                  primary={active.crew.name}
                  secondary={t(ROLE_LABEL_KEY[active.role])}
                  to="/crew"
                />
                {can('crew.settings') && (
                  <ListRow primary={t('settings.crewSettings')} to="/crew/ajustes" />
                )}
                {/* Un segundo equipo -el segundo local- no tenia puerta con uno
                    ya creado: solo quien tiene ficha de entrenador la ve. */}
                {trainer !== null && (
                  <ListRow primary={t('crewSwitcher.createAnother')} to="/crew/nuevo" />
                )}
                {ownStudentId !== undefined && (
                  <ListRow
                    primary={t('settings.leaveCrew')}
                    onSelect={() => setIsLeaveOpen(true)}
                    className="text-danger [&_span]:text-danger"
                  />
                )}
              </>
            )}
          </SettingsSection>

          <SettingsSection heading={t('settings.account')}>
            <ListRow
              primary={t('settings.password')}
              secondary={t('settings.password.hint')}
              onSelect={() => setIsPasswordOpen(true)}
              chevron
            />
            <ListRow primary={t('userMenu.logout')} onSelect={handleLogout} />
            <DeleteAccountSection />
          </SettingsSection>

          {/* El correo no se cambia, y el porqué va donde se lee. Un campo
              apagado sin explicación se lee como un fallo. */}
          <p className="text-xs text-ink/60">{t('settings.account.emailHint')}</p>
        </div>
      </div>

      {/*
        El perfil y la contraseña, en hojas: son formularios de seis campos que
        tenían la pantalla abierta de par en par para algo que se toca una vez.
        La clave es LA FICHA, no lo escrito en ella: al cambiar de persona el
        borrador se reinicia; con los valores como clave, guardar remontaba el
        formulario —al guardar cambian— y se perdía el acuse.
      */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.profile')}</DialogTitle>
          </DialogHeader>
          <ProfileFields
            key={profileId ?? 'sin-ficha'}
            initial={initial}
            saving={saving}
            asksBirthDate={owner === 'student'}
            onSave={save}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.password')}</DialogTitle>
            <DialogDescription>{t('settings.password.hint')}</DialogDescription>
          </DialogHeader>
          {/* Se cierra al guardar: aquí sí hay a dónde ir —fuera—, y dejarla
              abierta con la contraseña ya cambiada invita a cambiarla otra vez. */}
          <PasswordFields idPrefix="ajustes" onSaved={() => setIsPasswordOpen(false)} />
        </DialogContent>
      </Dialog>

      {active !== null && (
        <ConfirmDialog
          open={isLeaveOpen}
          title={t('settings.leaveCrewTitle', { crew: active.crew.name })}
          body={t('settings.leaveCrewBody')}
          confirmLabel={t('settings.leaveCrew')}
          destructive
          busy={leaving}
          error={leaveError}
          onOpenChange={setIsLeaveOpen}
          onConfirm={() => void handleLeave()}
        />
      )}
    </div>
  )
}

interface SettingsSectionProps {
  heading: string
  children: ReactNode
}

/** Un grupo de ajustes: su rótulo y sus filas. */
function SettingsSection({ heading, children }: SettingsSectionProps) {
  return (
    <section className="flex flex-col" aria-label={heading}>
      <h2 className="border-b border-cobalt-tint-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60">
        {heading}
      </h2>
      <ul>{children}</ul>
    </section>
  )
}

interface ProfileFieldsProps {
  initial: ProfileDraft
  saving: boolean
  /** La fecha de nacimiento es de la ficha de alumno; la de entrenador no la lleva. */
  asksBirthDate: boolean
  onSave: (draft: ProfileDraft) => Promise<boolean>
}

function ProfileFields({ initial, saving, asksBirthDate, onSave }: ProfileFieldsProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(initial)
  const [justSaved, setJustSaved] = useState(false)
  const [missingName, setMissingName] = useState(false)
  const { uploading, error: uploadError, upload } = usePhotoUpload()
  const photoInputId = useId()

  /*
   * Subir rellena el campo de la direccion; guardar sigue siendo el boton de
   * abajo. Asi la foto se ve antes de comprometerse, igual que una direccion
   * pegada, y cancelar es no pulsar guardar.
   */
  const handlePhotoChosen = async (file: File | undefined) => {
    if (file === undefined) return
    const url = await upload(file, 'profile')
    if (url !== null) setField('photoUrl', url)
  }

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
            {t('settings.profile.photo')}
          </Label>
          <Input
            id="perfil-foto"
            value={draft.photoUrl}
            onChange={(event) => setField('photoUrl', event.target.value)}
            placeholder="https://…"
            className="mt-1.5"
          />
          {/* O subirla. El campo oculto lleva la etiqueta del boton: es lo que
              hace que «Subir foto» abra el selector y siga siendo accesible. */}
          <input
            id={photoInputId}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => void handlePhotoChosen(event.target.files?.[0])}
          />
          <Button asChild type="button" variant="outline" size="sm" className="mt-2 gap-1.5">
            <label htmlFor={photoInputId}>
              <Upload className="size-3.5" />
              {uploading ? t('settings.profile.uploading') : t('settings.profile.upload')}
            </label>
          </Button>
          {uploadError !== null && (
            <p className="mt-1 text-[11px] font-semibold text-danger">{uploadError}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor="perfil-nombre" className={FIELD_LABEL}>
              {t('settings.profile.firstName')}
            </Label>
            {missingName && (
              <span className="text-[11px] font-semibold text-danger">
                {t('common.missingField')}
              </span>
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
            {t('settings.profile.lastName')}
          </Label>
          <Input
            id="perfil-apellidos"
            value={draft.lastName}
            onChange={(event) => setField('lastName', event.target.value)}
            className={cn('mt-1.5', missingName && draft.lastName.trim() === '' && 'border-danger')}
          />
        </div>
      </div>

      {/* La fecha la dice el propio alumno: el entrenador rara vez la sabe, y
          de ella sale la cohorte que pondera su progreso. Solo se enseña a el
          y a quien le entrena. */}
      {asksBirthDate && (
        <div>
          <Label htmlFor="perfil-nacimiento" className={FIELD_LABEL}>
            {t('settings.profile.birthDate')}
          </Label>
          <Input
            id="perfil-nacimiento"
            type="date"
            value={draft.birthDate}
            onChange={(event) => setField('birthDate', event.target.value)}
            className="mt-1.5"
          />
          <p className="mt-1 text-xs text-ink/60">{t('settings.profile.birthDateHint')}</p>
        </div>
      )}

      <Button type="submit" className="w-full gap-2" disabled={saving}>
        {justSaved ? <Check className="size-4" /> : null}
        {saving ? t('common.saving') : justSaved ? t('settings.profile.saved') : t('common.save')}
      </Button>
    </form>
  )
}
