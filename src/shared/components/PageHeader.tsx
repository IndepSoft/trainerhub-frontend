import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'

/**
 * Las piezas reciben lo mismo, así que comparten interfaz.
 */
interface PageHeaderSlotProps {
  children: ReactNode
  className?: string
}

/**
 * Cabecera de página, en el registro sobrio.
 *
 * Era una caja blanca con borde inferior y título en Bold. Eso obligó a que
 * dashboard, progreso y la sesión en vivo se hicieran cada una la suya, y a que
 * la aplicación conviviera con dos lenguajes de cabecera. Ahora la cabecera del
 * sistema ES esta, y las páginas que se la habían hecho aparte vuelven a usarla.
 *
 * Sin borde inferior a propósito: el primer bloque de contenido de cada página
 * ya trae su propia regla, y dos líneas seguidas se leen como un error.
 *
 * El relleno vertical es de 12/14 en móvil y de 24/20 desde `md`. Medido a
 * 390 × 844, la cabecera con acciones se llevaba entre 173 y 277 px de los
 * 780 útiles —el 40 % del viewport en la página del equipo— y el contenido,
 * que es lo único que se mira, arrancaba por debajo del tercio de pantalla.
 * El título no cambia de tamaño: la identidad no se toca, sólo lo que la
 * rodeaba.
 */
function PageHeaderRoot({ children, className }: PageHeaderSlotProps) {
  return (
    <header className={cn('shrink-0 bg-bone px-5 pt-3 pb-3.5 md:pt-6 md:pb-5', className)}>
      {children}
    </header>
  )
}

/**
 * Etiqueta corta sobre el título. Da contexto sin robarle peso.
 *
 * Se trunca porque en `Content` comparte fila con las acciones y una línea
 * es lo que cabe a su lado: un correo o una descripción larga partida en tres
 * líneas de once píxeles pesa más que el propio título. Lo que necesite
 * espacio va en `Description`, debajo y a todo el ancho.
 */
function PageHeaderEyebrow({ children, className }: PageHeaderSlotProps) {
  return (
    <p
      className={cn(
        '[grid-area:eyebrow] min-w-0 self-center truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/45',
        className
      )}
    >
      {children}
    </p>
  )
}

function PageHeaderTitle({ children, className }: PageHeaderSlotProps) {
  return (
    <h1
      className={cn(
        '[grid-area:title] min-w-0 font-display text-4xl font-extrabold uppercase leading-none tracking-tight text-ink',
        className
      )}
    >
      {children}
    </h1>
  )
}

/**
 * Frase de apoyo bajo el título. Opcional: la mayoría de páginas no la necesita.
 *
 * Va DESPUÉS de `Content`, como hermana, no dentro. La rejilla de `Content`
 * no le reserva fila: una fila vacía sigue cobrando su `gap`, y todas las
 * páginas sin descripción —que son casi todas— habrían pagado esos píxeles.
 */
function PageHeaderDescription({ children, className }: PageHeaderSlotProps) {
  return <p className={cn('mt-2 text-sm text-ink/50', className)}>{children}</p>
}

/**
 * Las acciones NUNCA apilan. Antes eran `flex-col` en móvil: cada botón
 * ocupaba una fila entera, y una página con tres accesos dedicaba 148 px a
 * botones antes de enseñar nada. En fila y a la derecha del eyebrow caben
 * porque cada acción es corta: la primaria es icono y una palabra, las
 * secundarias sólo icono. Ver `PrimaryAction` y `SecondaryAction`.
 */
function PageHeaderActions({ children, className }: PageHeaderSlotProps) {
  return (
    <div
      className={cn(
        '[grid-area:actions] flex shrink-0 items-center justify-end gap-2 self-center md:self-end',
        className
      )}
    >
      {children}
    </div>
  )
}

interface PageHeaderContentProps extends PageHeaderSlotProps {
  /**
   * Lo que va a la izquierda de eyebrow y título, a la altura de los dos: el
   * avatar de una ficha. Con él la rejilla gana una columna; sin él no la
   * reserva, porque una columna vacía seguiría cobrando su `gap`.
   */
  leading?: ReactNode
}

/**
 * Las áreas, en móvil y desde `md`. Los guiones bajos son espacios: es la
 * sintaxis de Tailwind para valores arbitrarios.
 *
 * Móvil: el eyebrow y las acciones comparten la primera fila —la de 44 px que
 * las acciones necesitan de todos modos— y el título va debajo a todo el
 * ancho, que es lo que le hace falta a 36 px en Condensed: «ENTRENAMIENTOS»
 * mide 260 y no cabe junto a nada.
 *
 * Desde `md` las acciones abarcan las dos filas y se alinean con la base del
 * título, que es la composición de escritorio que ya había.
 */
const CONTENT_AREAS =
  "grid-cols-[minmax(0,1fr)_auto] [grid-template-areas:'eyebrow_actions'_'title_title'] md:[grid-template-areas:'eyebrow_actions'_'title_actions']"

const CONTENT_AREAS_WITH_LEADING =
  "grid-cols-[auto_minmax(0,1fr)_auto] [grid-template-areas:'leading_eyebrow_actions'_'leading_title_title'] md:[grid-template-areas:'leading_eyebrow_actions'_'leading_title_actions']"

/**
 * Eyebrow, título y acciones, colocados por área y no por orden de aparición.
 *
 * Es lo que permite que el DOM vaya en el orden en que se lee —eyebrow,
 * título, acciones— mientras en móvil las acciones se pintan ARRIBA, junto al
 * eyebrow. Con un `flex` habría que elegir entre un orden de lectura raro o
 * dos filas apiladas, que es justo lo que se quita.
 */
function PageHeaderContent({ children, className, leading }: PageHeaderContentProps) {
  return (
    <div
      className={cn(
        'grid gap-x-3 gap-y-1.5 md:gap-x-6 md:gap-y-0',
        leading === undefined ? CONTENT_AREAS : CONTENT_AREAS_WITH_LEADING,
        className
      )}
    >
      {leading !== undefined && (
        <div className="[grid-area:leading] self-center">{leading}</div>
      )}
      {children}
    </div>
  )
}

interface PageHeaderActionBaseProps {
  icon: LucideIcon
  /**
   * El nombre completo de la acción. Es lo que lee el lector de pantalla en
   * todos los tamaños —va en `aria-label`— y lo que se ve desde `md`.
   */
  label: string
  /** Con destino la acción es un enlace; sin él, un botón. */
  to?: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
}

interface PageHeaderPrimaryActionProps extends PageHeaderActionBaseProps {
  /**
   * Lo que se ve en móvil: UNA palabra. El verbo lo pone el contexto de la
   * pantalla —en Alumnos, «Alumno» sólo puede significar añadir uno—. Tiene
   * que estar contenida en `label`: quien dicta por voz lo que ve tiene que
   * dar con el control (WCAG 2.5.3, «Label in Name»).
   */
  shortLabel?: string
}

/**
 * La acción principal de la página: píldora Cobalt, icono y una palabra.
 *
 * Una por página. Es lo que se hace a diario en esa pantalla —crear una
 * rutina, añadir un alumno, agendar— y por eso lleva color; lo demás va en
 * `SecondaryAction`.
 */
function PageHeaderPrimaryAction({
  icon: Icon,
  label,
  shortLabel,
  to,
  onClick,
  disabled,
  type = 'button',
}: PageHeaderPrimaryActionProps) {
  const mobileLabel = shortLabel ?? label
  const content = (
    <>
      <Icon strokeWidth={2.25} />
      {mobileLabel === label ? (
        <span>{label}</span>
      ) : (
        <>
          <span className="md:hidden">{mobileLabel}</span>
          <span className="hidden md:inline">{label}</span>
        </>
      )}
    </>
  )
  const className = 'gap-1.5 rounded-action ps-3 pe-4'

  if (to !== undefined) {
    return (
      <Button asChild className={className} aria-label={label}>
        <Link to={to}>{content}</Link>
      </Button>
    )
  }

  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      aria-label={label}
    >
      {content}
    </Button>
  )
}

interface PageHeaderSecondaryActionProps extends PageHeaderActionBaseProps {
  /** `danger` para lo que destruye: borrar una rutina, un plan. */
  tone?: 'neutral' | 'danger'
}

/**
 * Acción secundaria: en móvil un círculo de 44 px con sólo el icono y su
 * nombre en `aria-label`; desde `md`, icono y texto como siempre.
 *
 * Sin texto en móvil porque es lo que hace que tres quepan en la fila del
 * eyebrow. Se entra a ellas de vez en cuando —el catálogo, los ajustes— y un
 * icono reconocible con nombre accesible basta; lo que se hace a diario es la
 * primaria, y esa sí lleva palabra.
 */
function PageHeaderSecondaryAction({
  icon: Icon,
  label,
  to,
  onClick,
  disabled,
  type = 'button',
  tone = 'neutral',
}: PageHeaderSecondaryActionProps) {
  const content = (
    <>
      <Icon />
      <span className="hidden md:inline">{label}</span>
    </>
  )
  const className = cn(
    'w-11 rounded-action px-0 md:w-auto md:px-4',
    tone === 'danger' && 'text-danger'
  )

  if (to !== undefined) {
    return (
      <Button asChild variant="outline" className={className} aria-label={label}>
        <Link to={to}>{content}</Link>
      </Button>
    )
  }

  return (
    <Button
      type={type}
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className={className}
      aria-label={label}
    >
      {content}
    </Button>
  )
}

export const PageHeader = Object.assign(PageHeaderRoot, {
  Eyebrow: PageHeaderEyebrow,
  Title: PageHeaderTitle,
  Description: PageHeaderDescription,
  Actions: PageHeaderActions,
  Content: PageHeaderContent,
  PrimaryAction: PageHeaderPrimaryAction,
  SecondaryAction: PageHeaderSecondaryAction,
})
