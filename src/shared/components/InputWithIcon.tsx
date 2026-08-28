import * as React from 'react'
import { Input } from '@/shared/ui/input'
import { cn } from '@/shared/lib/utils'

interface InputWithIconProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  loading?: boolean
  error?: boolean
}

export function InputWithIcon({
  icon,
  iconPosition = 'left',
  loading = false,
  error = false,
  className,
  ...props
}: InputWithIconProps) {
  const paddingClass = iconPosition === 'left' ? 'pl-10' : 'pr-10'
  const iconPositionClass = iconPosition === 'left' ? 'left-3' : 'right-3'
  
  return (
    <div className="relative w-full text-gray-400">
      {(icon || loading) && (
        <span className={cn('absolute top-1/2 -translate-y-1/2', iconPositionClass)}>
          {loading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            icon
          )}
        </span>
      )}
      <Input
        {...props}
        className={cn(paddingClass, error && 'border-red-500', className)}
        disabled={loading || props.disabled}
      />
    </div>
  )
}