import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

/**
 * Las cuatro piezas reciben lo mismo, asi que comparten interfaz. Antes habia
 * cuatro declaraciones identicas de `{ children, className }`.
 */
interface PageHeaderSlotProps {
  children: ReactNode
  className?: string
}

function PageHeaderRoot({ children, className }: PageHeaderSlotProps) {
  return (
    <header
      className={cn(
        'flex flex-col space-y-4 p-2 pb-6 bg-white border-b',
        className
      )}
    >
      {children}
    </header>
  )
}

function PageHeaderTitle({ children, className }: PageHeaderSlotProps) {
  return (
    <h1
      className={cn(
        'text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900',
        className
      )}
    >
      {children}
    </h1>
  )
}

function PageHeaderActions({ children, className }: PageHeaderSlotProps) {
  return (
    <div
      className={cn(
        'flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2',
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
        'flex flex-col space-y-2 md:flex-row md:justify-between md:items-end md:space-y-0',
        className
      )}
    >
      {children}
    </div>
  )
}

export const PageHeader = Object.assign(PageHeaderRoot, {
  Title: PageHeaderTitle,
  Actions: PageHeaderActions,
  Content: PageHeaderContent,
})
