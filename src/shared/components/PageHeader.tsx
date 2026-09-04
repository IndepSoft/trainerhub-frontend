import type { ReactNode } from 'react'
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
 */
function PageHeaderRoot({ children, className }: PageHeaderSlotProps) {
  return (
    <header className={cn('shrink-0 bg-bone px-5 pt-6 pb-5', className)}>
      {children}
    </header>
  )
}

/** Etiqueta corta sobre el título. Da contexto sin robarle peso. */
function PageHeaderEyebrow({ children, className }: PageHeaderSlotProps) {
  return (
    <p
      className={cn(
        'text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/45',
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
        'font-display text-4xl font-extrabold uppercase leading-none tracking-tight text-ink',
        className
      )}
    >
      {children}
    </h1>
  )
}

/** Frase de apoyo bajo el título. Opcional: la mayoría de páginas no la necesita. */
function PageHeaderDescription({ children, className }: PageHeaderSlotProps) {
  return <p className={cn('mt-2 text-sm text-ink/50', className)}>{children}</p>
}

function PageHeaderActions({ children, className }: PageHeaderSlotProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 sm:flex-row sm:items-center',
        className
      )}
    >
      {children}
    </div>
  )
}

function PageHeaderContent({ children, className }: PageHeaderSlotProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6',
        className
      )}
    >
      {children}
    </div>
  )
}

export const PageHeader = Object.assign(PageHeaderRoot, {
  Eyebrow: PageHeaderEyebrow,
  Title: PageHeaderTitle,
  Description: PageHeaderDescription,
  Actions: PageHeaderActions,
  Content: PageHeaderContent,
})
