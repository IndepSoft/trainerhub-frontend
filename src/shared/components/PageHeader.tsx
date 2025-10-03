import type { ReactNode } from 'react'

interface PageHeaderProps {
  children: ReactNode
  className?: string
}

interface PageHeaderTitleProps {
  children: ReactNode
  className?: string
}

interface PageHeaderActionsProps {
  children: ReactNode
  className?: string
}

interface PageHeaderContentProps {
  children: ReactNode
  className?: string
}

// Componente principal
function PageHeaderRoot({ children, className = '' }: PageHeaderProps) {
  return (
    <header
      className={`flex flex-col  space-y-4 p-2 pb-6 bg-white border-b ${className}`}
    >
      {children}
    </header>
  )
}

// Componentes secundarios
function PageHeaderTitle({ children, className = '' }: PageHeaderTitleProps) {
  return (
    <h1
      className={`text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 ${className}`}
    >
      {children}
    </h1>
  )
}

function PageHeaderActions({ children, className = '' }: PageHeaderActionsProps) {
  return (
    <div
      className={`flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 ${className}`}
    >
      {children}
    </div>
  )
}

function PageHeaderContent({ children, className = '' }: PageHeaderContentProps) {
  return (
    <div
      className={`flex flex-col space-y-2 md:flex-row md:justify-between md:items-end md:space-y-0 ${className}`} // space-y-2 en lugar de space-y-3
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
