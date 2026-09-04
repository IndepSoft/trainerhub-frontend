import * as React from 'react'

import { cn } from '@/shared/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // `h-11` en movil y `md:h-9` de vuelta en escritorio, igual que
          // `Button` y `SelectTrigger`. El campo se habia quedado en 36 px
          // cuando esos dos subieron a 44: en un formulario largo eso deja
          // desplegables de 44 junto a casillas de 36, que se ve desalineado
          // ademas de incumplir el objetivo tactil de la regla 1.6.
          'flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:h-9 md:text-sm',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
