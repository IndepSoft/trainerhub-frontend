import { Link, useLocation } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface NavItemProps {
  to: string
  icon?: LucideIcon
  children: React.ReactNode
  active?: boolean
  disabled?: boolean
  badge?: string | number
  className?: string
  onClick?: () => void
}

export function NavItem({
  to,
  icon: Icon,
  children,
  active,
  disabled = false,
  badge,
  className,
  onClick,
}: NavItemProps) {
  const location = useLocation()
  const isActive = active ?? location.pathname === to
  const baseClasses = cn(
    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
    {
      'bg-primary text-primary-foreground shadow-sm': isActive,
      'text-muted-foreground hover:bg-accent hover:text-accent-foreground':
        !isActive && !disabled,
      'opacity-50 cursor-not-allowed': disabled,
      'hover:scale-105': !isActive && !disabled,
    },
    className
  )
  const content = (
    <>
      {Icon && (
        <Icon
          className={cn(
            'size-4 shrink-0',
            isActive ? 'text-primary-foreground' : 'text-muted-foreground'
          )}
        />
      )}
      <span className="truncate">{children}</span>
      {badge && (
        <span
          className={cn(
            'ml-auto px-2 py-0.5 text-xs font-medium rounded-full',
            isActive
              ? 'bg-primary-foreground/20 text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {badge}
        </span>
      )}
    </>
  )

  if (disabled) {
    return <div className={baseClasses}>{content}</div>
  }

  return (
    <Link
      to={to}
      className={baseClasses}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
    >
      {content}
    </Link>
  )
}
