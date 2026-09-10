import { useId, useState, type FormEvent } from 'react'
import { Check, LogOut, Upload, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { container } from '@/app/container'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { describeError } from '@/shared/i18n/errorMessages'
import { useViewerContext } from '@/app/ViewerContext'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
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
import { ThemeSelector } from '../components/ThemeSelector'
import { LanguageSelector } from '../components/LanguageSelector'
import { SoundToggle } from '../components/SoundToggle'
import { DeleteAccountSection } from '../components/DeleteAccountSection'

const FIELD_LABEL =
  'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60'
const SECTION_TITLE =
  'border-b border-cobalt-tint-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/60'

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
  const { owner, profileId, initial, email, saving, error, save } =
    useProfileEditor()
  const { handleLogout } = useLogout()
  const { active, trainer, can } = useViewerContext()
  const navigate = useNavigate()

  /*
   * SALIR DEL EQUIPO, que no existia: un alumno activo solo podia irse
   * eliminando la cuenta entera. Es la misma baja que da el entrenador,
   * sobre la propia ficha; la base lo permite solo a quien esta dentro.
   */
  const [isLeaveOpen, setIsLeaveOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [leaveError, setLeaveError] = useState<string | null>(null)
  const ownStudentId = active?.role === 'student' ? active.student?.id : undefined

  const handleLeave = async () => {
    if (ownStudentId === undefined) return
    setLeaving(true)
    setLeaveError(null)
    try {
      await container.students.deactivate(ownStudentId)
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

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bone">
      <PageHeader className="pb-4">
        <PageHeader.Eyebrow>{t('settings.eyebrow')}</PageHeader.Eyebrow>
        <PageHeader.Title>{t('settings.title')}</PageHeader.Title>
      </PageHeader>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-md space-y-8 px-5 py-6">
          <section aria-labelledby="perfil-titulo" className="space-y-4">
            <h2 id="perfil-titulo" className={SECTION_TITLE}>
              {t('settings.profile')}
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
                {t('settings.profile.noRecord')}
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
                asksBirthDate={owner === 'student'}
                onSave={save}
              />
            )}
          </section>

          <section aria-labelledby="apariencia-titulo" className="space-y-4">
            <h2 id="apariencia-titulo" className={SECTION_TITLE}>
              {t('settings.appearance')}
            </h2>

            <div>
              <span className={cn('block', FIELD_LABEL)}>
                {t('settings.theme')}
              </span>
              <div className="mt-2">
                <ThemeSelector />
              </div>
            </div>

            <div>
              <span className={cn('block', FIELD_LABEL)}>
                {t('settings.language')}
              </span>
              <div className="mt-2">
                <LanguageSelector />
              </div>
            </div>
          </section>

          {/* Entrenamiento y no «notificaciones»: esto no notifica nada
              desde fuera, suena mientras se entrena y con la pantalla delante.
              Llamarlo aviso haría buscarlo donde no está. */}
          <section aria-labelledby="entrenamiento-titulo" className="space-y-4">
            <h2 id="entrenamiento-titulo" className={SECTION_TITLE}>
              {t('settings.training')}
            </h2>

            <div>
              <span className={cn('block', FIELD_LABEL)}>
                {t('settings.sound')}
              </span>
              <div className="mt-2">
                <SoundToggle />
              </div>
            </div>
          </section>

          {/*
            La puerta al equipo desde la configuracion. Los ajustes del equipo
            viven en `/crew/ajustes` -son de la casa, no de la persona-, pero
            quien buscaba aqui «mi equipo» no encontraba ni el enlace, y quien
            no tiene equipo no encontraba como tenerlo.
          */}
          <section aria-labelledby="equipo-titulo" className="space-y-4">
            <h2 id="equipo-titulo" className={SECTION_TITLE}>
              {t('settings.crew')}
            </h2>
            {active === null ? (
              <>
                <p className="text-sm text-ink/60">{t('settings.crewNone')}</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {trainer !== null && (
                    <Button asChild className="gap-2">
                      <Link to="/crew/nuevo">
                        <Users className="size-4" />
                        {t('crew.create')}
                      </Link>
                    </Button>
                  )}
                  <Button asChild variant="outline">
                    <Link to="/crew/unirse">{t('joinCrew.haveCode')}</Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" className="gap-2">
                  <Link to="/crew">
                    <Users className="size-4" />
                    {t('crewSwitcher.viewCrew')}
                  </Link>
                </Button>
                {can('crew.settings') && (
                  <Button asChild variant="outline">
                    <Link to="/crew/ajustes">{t('settings.crewSettings')}</Link>
                  </Button>
                )}
                {/* Un segundo equipo -el segundo local- no tenia puerta con uno
                    ya creado: solo quien tiene ficha de entrenador la ve. */}
                {trainer !== null && (
                  <Button asChild variant="outline">
                    <Link to="/crew/nuevo">{t('crewSwitcher.createAnother')}</Link>
                  </Button>
                )}
                {ownStudentId !== undefined && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-danger hover:text-danger"
                    onClick={() => setIsLeaveOpen(true)}
                  >
                    {t('settings.leaveCrew')}
                  </Button>
                )}
              </div>

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
              </>
            )}
          </section>

          <section aria-labelledby="cuenta-titulo" className="space-y-4">
            <h2 id="cuenta-titulo" className={SECTION_TITLE}>
              {t('settings.account')}
            </h2>

            <div>
              <span className={cn('block', FIELD_LABEL)}>
                {t('settings.account.email')}
              </span>
              <p className="mt-1 text-sm text-ink/70">
                {email === '' ? '—' : email}
              </p>
              <p className="mt-1 text-xs text-ink/45">
                {/* El porqué, donde se ve que no se puede cambiar. Un campo
                    apagado sin explicación se lee como un fallo. */}
                {t('settings.account.emailHint')}
              </p>
            </div>

            <div>
              <span className={cn('block', FIELD_LABEL)}>
                {t('settings.password')}
              </span>
              <p className="mb-3 mt-1 text-xs text-ink/45">
                {t('settings.password.hint')}
              </p>
              {/* Quedarse aquí al guardar: no hay a dónde ir, y el acuse lo
                  pone el propio botón. */}
              <PasswordFields idPrefix="ajustes" onSaved={() => undefined} />
            </div>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              {t('userMenu.logout')}
            </Button>

            <DeleteAccountSection />
          </section>
        </div>
      </div>
    </div>
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
          <AvatarImage
            src={draft.photoUrl === '' ? undefined : draft.photoUrl}
            alt=""
          />
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
            onChange={(event) =>
              void handlePhotoChosen(event.target.files?.[0])
            }
          />
          <Button
            asChild
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 gap-1.5"
          >
            <label htmlFor={photoInputId}>
              <Upload className="size-3.5" />
              {uploading
                ? t('settings.profile.uploading')
                : t('settings.profile.upload')}
            </label>
          </Button>
          {uploadError !== null && (
            <p className="mt-1 text-[11px] font-semibold text-danger">
              {uploadError}
            </p>
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
            className={cn(
              'mt-1.5',
              missingName && draft.firstName.trim() === '' && 'border-danger'
            )}
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
            className={cn(
              'mt-1.5',
              missingName && draft.lastName.trim() === '' && 'border-danger'
            )}
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
          <p className="mt-1 text-xs text-ink/55">{t('settings.profile.birthDateHint')}</p>
        </div>
      )}

      <Button type="submit" className="w-full gap-2" disabled={saving}>
        {justSaved ? <Check className="size-4" /> : null}
        {saving
          ? t('common.saving')
          : justSaved
            ? t('settings.profile.saved')
            : t('common.save')}
      </Button>
    </form>
  )
}
